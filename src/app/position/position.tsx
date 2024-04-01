"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.scss";
import fetchTokenIcons from "../_api/fetchTokenIcons";
import Image from "next/image";
import defaultImg from "@/assets/icons/defaultProtocol.svg";
import {
  getHealthFactorClass,
  getTokenSymbol,
  protocolToTitle,
  roundedHealthFactor,
  formatAddress,
  getMarketSymbol,
} from "../_utils/textHandling";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader, Tooltip } from "@mantine/core";
import Link from "next/link";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Label,
  Tooltip as PieTooltip,
} from "recharts";

export default function Position({
  searchParams,
  defaultPosition,
  tokenPrices,
  covarianceMatrices,
}) {
  const [position, setPosition] = useState(defaultPosition || []);
  const [address, setAddress] = useState(searchParams.address || "");
  const [tokenIcons, setTokenIcons] = useState({});
  const [lookBack, setLookBack] = useState(searchParams.lookBack || "180"); // Default 180 days
  const [lookForward, setLookForward] = useState(
    searchParams.lookForward || "30"
  ); // Default 30 days
  const [probabilityCutoff, setProbabilityCutoff] = useState(
    searchParams.probabilityCutoff || ".05"
  ); // Default 5%
  const [riskProfile, setRiskProfile] = useState({});
  const router = useRouter();
  const nextSearchParams = useSearchParams();

  const pieColors = [
    "#1FCFCF",
    "#98DA8B",
    "#F5CB39",
    "#F2516A",
    "#EE40BD",
    "#73A2D5",
  ];

  useEffect(() => {
    setAddress(searchParams.address || "");

    const lookBack = searchParams.lookBack || "180";
    setLookBack(lookBack);
    const lookForward = searchParams.lookForward || "30";
    setLookForward(lookForward);
    const probabilityCutoff = searchParams.probabilityCutoff || ".05";
    setProbabilityCutoff(probabilityCutoff);

    if (defaultPosition) {
      let newPosition = defaultPosition;

      const suppliedTokens = newPosition.map((protocol) => {
        return protocol.position.supplied.map((token) => {
          return token.symbol;
        });
      });

      const borrowedTokens = newPosition.map((protocol) => {
        return protocol.position.borrowed.map((token) => {
          return token.symbol;
        });
      });

      const tokenArray = [
        ...new Set(suppliedTokens.flat().concat(borrowedTokens.flat())),
      ];

      // Getting prices
      newPosition = newPosition.map((protocol) => {
        const name = protocol.protocol.name;
        const chain = protocol.protocol.chain;
        const version = protocol.protocol.version;

        protocol.position.supplied = protocol.position.supplied.map((token) => {
          const tokenPrice = tokenPrices.find(
            (price) =>
              price.token_symbol === token.symbol &&
              price.protocol === name &&
              price.chain === chain &&
              price.version === version
          ).price;

          token.price = tokenPrice;
          token.value = token.balance * tokenPrice;

          return token;
        });

        protocol.position.borrowed = protocol.position.borrowed.map((token) => {
          const tokenPrice = tokenPrices.find(
            (price) =>
              price.token_symbol === token.symbol &&
              price.protocol === name &&
              price.chain === chain &&
              price.version === version
          ).price;

          token.price = tokenPrice;
          token.value = token.balance * tokenPrice;

          return token;
        });

        protocol.token_array = tokenArray;

        return protocol;
      });
      setPosition(newPosition);

      // Getting token icons
      fetchTokenIcons(tokenArray, false, false).then((icons) => {
        setTokenIcons(icons);
      });
    }
  }, [defaultPosition]);

  useEffect(() => {
    if (position.length > 0) {
      refreshRiskProfile(position);
    }
  }, [position, lookForward, lookBack, probabilityCutoff, covarianceMatrices]);

  function handleSearch(address) {
    if (address === searchParams.address) {
      return;
    }

    if (address) {
      router.push(`/position?address=${address}`);
    } else {
      router.push(`/position`);
    }

    setPosition([]);
  }

  function handleParameterChange(parameter, value) {
    const newSearchParams = new URLSearchParams(nextSearchParams);
    newSearchParams.set(parameter, value);
    router.push(`/position?${newSearchParams.toString()}`);
  }

  function CustomTooltip(props) {
    if (!props.active || !props.payload) {
      return null;
    }
    const payload = props.payload[0].payload.payload;

    const value = payload.value.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });

    const balance = payload.balance.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });

    const tokenSymbol = getTokenSymbol(payload.symbol);

    return (
      <div className={styles.customTooltip}>
        <div className={styles.header}>
          <Image
            src={tokenIcons[tokenSymbol] ? tokenIcons[tokenSymbol] : defaultImg}
            width={30}
            height={30}
            alt={tokenSymbol}
          />
          {tokenSymbol}
        </div>
        <span className={styles.ratio}></span>
        <span className={styles.balance}>
          {balance} {tokenSymbol}
        </span>
        <span className={styles.value}>${value}</span>
      </div>
    );
  }

  function getTokensWithHighCorrelation(tokenA, protocol, covarianceMatrix) {
    if (!protocol.token_array) {
      return ["NA"];
    }

    let highCorrelationTokens = [];

    const tokenAIndex =
      2 * covarianceMatrix.indexToToken[getTokenSymbol(tokenA.symbol)];

    protocol.token_array.forEach((tokenB) => {
      if (getTokenSymbol(tokenB) === getTokenSymbol(tokenA.symbol)) {
        return;
      }

      const tokenBIndex =
        2 * covarianceMatrix.indexToToken[getTokenSymbol(tokenB)];

      const correlation =
        covarianceMatrix.correlation[tokenAIndex][tokenBIndex];

      // If absolute value of correlation is greater than 0.6
      if (Math.abs(correlation) > 0.6) {
        highCorrelationTokens.push(getTokenSymbol(tokenB));
      }
    });

    return highCorrelationTokens.length === 0 ? ["NA"] : highCorrelationTokens;
  }

  function getTotalLiquidationFee(protocol, covarianceMatrix) {
    let totalLiquidationFee = 0;

    protocol.position.supplied.forEach((token) => {
      const liquidationFee = getLiquidationFee(
        token,
        protocol,
        covarianceMatrix
      ).replace(/,/g, "");

      totalLiquidationFee += Number(liquidationFee);
    });

    return totalLiquidationFee.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
  }

  function getLiquidationFee(token, protocol, covarianceMatrix) {
    if (!protocol.token_array) {
      return "NA";
    }

    const tokenData = covarianceMatrix.token_data.find(
      (tokenData) =>
        tokenData.underlying_symbol === getTokenSymbol(token.symbol)
    );

    if (!tokenData) {
      return "NA";
    }

    const liquidationFee = tokenData.liquidation_fee * token.value;

    return liquidationFee.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
  }

  function refreshRiskProfile(position) {
    const riskProfile = position
      .map((protocol) => {
        const protocolRiskProfile = analyzeProtocol(
          covarianceMatrices[
            `${protocol.protocol.name}-v${protocol.protocol.version}-${protocol.protocol.chain}`
          ][protocol.market],
          protocol,
          lookForward
        );

        return {
          [`${protocol.protocol.protocol}-${protocol.market}`]:
            protocolRiskProfile,
        };
      })
      .reduce((acc, cur) => {
        return { ...acc, ...cur };
      });

    setRiskProfile(riskProfile);
  }

  function analyzeProtocol(covarianceMatrix, protocol, lookForward) {
    if (!covarianceMatrix) {
      return {
        probability: "NA",
        daysToLiquidation: "NA",
      };
    }

    let positionVector = {};
    const metadata = protocol.metadata[protocol.market];

    const total = metadata.total_supplied + metadata.total_borrowed;
    const difference = metadata.total_supplied - metadata.total_borrowed;
    let positionVariance = 0;
    let positionMeanReturn = 0;
    lookForward = Number(lookForward);

    protocol.position.supplied.forEach((token) => {
      positionVector[`${getTokenSymbol(token.symbol)}_supplied`] =
        token.value / total;
    });

    protocol.position.borrowed.forEach((token) => {
      positionVector[`${getTokenSymbol(token.symbol)}_borrowed`] =
        token.value / total;
    });

    const tokens = Object.keys(positionVector);

    tokens.forEach((tokenA) => {
      tokenA = getTokenSymbol(tokenA);
      let tokenAIndex =
        2 * covarianceMatrix.indexToToken[getTokenSymbol(tokenA.split("_")[0])];
      if (tokenA.includes("borrowed")) {
        tokenAIndex += 1;
      }

      positionMeanReturn +=
        positionVector[tokenA] * covarianceMatrix.meanReturns[tokenAIndex];

      tokens.forEach((tokenB) => {
        let tokenBIndex =
          2 *
          covarianceMatrix.indexToToken[getTokenSymbol(tokenB.split("_")[0])];
        if (tokenB.includes("borrowed")) {
          tokenBIndex += 1;
        }

        positionVariance +=
          positionVector[tokenA] *
          positionVector[tokenB] *
          covarianceMatrix.covariance[tokenAIndex][tokenBIndex];
      });
    });

    const zScore = getZScore(
      total,
      difference,
      positionVariance,
      positionMeanReturn,
      lookForward
    );

    const probability = cdfNormal(zScore, 0, 1);
    const daysToLiquidation = getDaysToLiquidation(
      total,
      difference,
      positionVariance,
      positionMeanReturn,
      probabilityCutoff
    );

    return {
      probability: probability,
      daysToLiquidation: daysToLiquidation,
    };
  }

  function getDaysToLiquidation(
    total,
    difference,
    variance,
    meanReturn,
    probabilityCutoff
  ) {
    probabilityCutoff = Number(probabilityCutoff);

    const a = (meanReturn - variance / 2) ** 2;
    const b =
      -2 *
        (meanReturn - variance / 2) *
        Math.log((total - difference) / total) -
      cdfNormalInverse(probabilityCutoff) ** 2 * variance;
    const c = Math.log((total - difference) / total) ** 2;

    // Calculating solutions
    const solutionA = (-b + Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);
    const solutionB = (-b - Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);

    // Logic to return the valid solution
    let validSolutions = [];
    if (solutionA > 0) validSolutions.push(solutionA);
    if (solutionB > 0) validSolutions.push(solutionB);

    if (validSolutions.length === 0) {
      return "NA"; // No positive solutions
    } else {
      const soonerTime = Math.min(...validSolutions); // Return the smaller positive solution
      if (soonerTime > 1000) {
        return "NA";
      }
      return soonerTime;
    }
  }

  function getZScore(total, difference, variance, meanReturn, lookForward) {
    return (
      (Math.log((total - difference) / total) -
        (meanReturn - variance / 2) * lookForward) /
      Math.sqrt(variance * lookForward)
    );
  }

  function cdfNormalInverse(p) {
    var a1 = -39.6968302866538,
      a2 = 220.946098424521,
      a3 = -275.928510446969;
    var a4 = 138.357751867269,
      a5 = -30.6647980661472,
      a6 = 2.50662827745924;
    var b1 = -54.4760987982241,
      b2 = 161.585836858041,
      b3 = -155.698979859887;
    var b4 = 66.8013118877197,
      b5 = -13.2806815528857,
      c1 = -7.78489400243029e-3;
    var c2 = -0.322396458041136,
      c3 = -2.40075827716184,
      c4 = -2.54973253934373;
    var c5 = 4.37466414146497,
      c6 = 2.93816398269878,
      d1 = 7.78469570904146e-3;
    var d2 = 0.32246712907004,
      d3 = 2.445134137143,
      d4 = 3.75440866190742;
    var p_low = 0.02425,
      p_high = 1 - p_low;
    var q, r;
    var retVal;

    if (p < 0 || p > 1) {
      alert("NormSInv: Argument out of range.");
      retVal = 0;
    } else if (p < p_low) {
      q = Math.sqrt(-2 * Math.log(p));
      retVal =
        (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
        ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    } else if (p <= p_high) {
      q = p - 0.5;
      r = q * q;
      retVal =
        ((((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q) /
        (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      retVal =
        -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
        ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    }

    return retVal;
  }

  function cdfNormal(x, mean, std) {
    let Z = (x - mean) / std;
    let t = 1 / (1 + 0.2315419 * Math.abs(Z));
    let d = 0.3989423 * Math.exp((-Z * Z) / 2);
    let prob =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (Z > 0) prob = 1 - prob;
    return prob;
  }

  return (
    <div className={styles.positionContainer}>
      <div className={styles.inputs}>
        <div className={styles.search}>
          <input
            type="text"
            placeholder={"Search Address"}
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              handleSearch(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(address);
              }
              if (e.key === "Escape") {
                setAddress("");
                handleSearch("");
              }
            }}
            onBlur={() => {
              handleSearch(address);
            }}
          />
          {address.length > 0 && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              onClick={() => {
                setAddress("");
                handleSearch("");
              }}
              className={styles.clear}
            >
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
            </svg>
          )}
          <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.searchIcon}
            onClick={() => {
              handleSearch(address);
            }}
          >
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
          </svg>
        </div>
        <Tooltip
          label={
            "The number of days to analyze the price action of tokens within the wallet's position."
          }
          position="bottom"
          withArrow
          classNames={{
            tooltip: styles.tooltip,
          }}
        >
          <div className={styles.input}>
            <span>Look Back:</span>
            <select
              value={lookBack}
              onChange={(e) => {
                setLookBack(e.target.value);
                handleParameterChange("lookBack", e.target.value);
                setPosition([]);
              }}
            >
              <option value={"30"}>30 Days</option>
              <option value={"90"}>90 Days</option>
              <option value={"180"}>180 Days</option>
            </select>
          </div>
        </Tooltip>

        <Tooltip
          label={"The time horizon to analyze the probability of liquidation."}
          position="bottom"
          withArrow
          classNames={{
            tooltip: styles.tooltip,
          }}
        >
          <div className={styles.input}>
            <span>Look Forward:</span>
            <select
              value={lookForward}
              onChange={(e) => {
                setLookForward(e.target.value);
              }}
            >
              <option value={"30"}>30 Days</option>
              <option value={"90"}>90 Days</option>
              <option value={"180"}>180 Days</option>
            </select>
          </div>
        </Tooltip>

        <Tooltip
          label={"The probability cutoff to determine the days to liquidation."}
          position="bottom"
          withArrow
          classNames={{
            tooltip: styles.tooltip,
          }}
        >
          <div className={styles.input}>
            <span>Cutoff:</span>
            <select
              value={probabilityCutoff}
              onChange={(e) => {
                setProbabilityCutoff(e.target.value);
              }}
            >
              <option value={".05"}>5%</option>
              <option value={".1"}>10%</option>
              <option value={".2"}>20%</option>
              <option value={".5"}>50%</option>
            </select>
          </div>
        </Tooltip>
      </div>
      {position.length === 0 && address.length > 0 && (
        <div className={styles.loader}>
          <Loader size="xl" color="#1fcfcf" />
        </div>
      )}
      {position.length > 0 && (
        <h1>
          Displaying Risk Profile For <span>{address}</span>
        </h1>
      )}
      {position.length > 0 &&
        position.map((protocol, index) => {
          const metadata = protocol.metadata[protocol.market] || null;

          if (metadata.total_supplied < 1 || !metadata) {
            return <></>;
          }

          const covarianceMatrix =
            covarianceMatrices[
              `${protocol.protocol.name}-v${protocol.protocol.version}-${protocol.protocol.chain}`
            ][protocol.market];

          if (
            !riskProfile[`${protocol.protocol.protocol}-${protocol.market}`]
          ) {
            return <></>;
          }

          const formattedProbability = riskProfile[
            `${protocol.protocol.protocol}-${protocol.market}`
          ].probability.toLocaleString("en-US", {
            style: "percent",
            maximumFractionDigits: 2,
          });

          const formattedDaysToLiquidation = riskProfile[
            `${protocol.protocol.protocol}-${protocol.market}`
          ].daysToLiquidation.toLocaleString("en-US", {
            maximumFractionDigits: 0,
          });

          const marketName = getMarketSymbol(
            `${protocol.protocol.chain}-${protocol.market}`
          );

          return (
            <div className={styles.protocol} key={index}>
              <div className={styles.pieCharts}>
                <ResponsiveContainer
                  className={styles.chart}
                  width="100%"
                  height="100%"
                >
                  <PieChart width={400} height={400}>
                    <Pie
                      data={protocol.position.supplied}
                      cx="50%"
                      cy="50%"
                      innerRadius={110}
                      outerRadius={140}
                      fill="#8884d8"
                      paddingAngle={0}
                      dataKey="value"
                      style={{ cursor: "pointer", outline: "none" }}
                    >
                      <Label
                        position="center"
                        offset={0}
                        value={"Supplied"}
                        style={{
                          fontSize: "1rem",
                          stroke: "white",
                          fill: "white",
                          fontWeight: "100",
                        }}
                        className={`${styles.label} ${styles.title}`}
                      />
                      <Label
                        position="center"
                        offset={0}
                        value={
                          "$" +
                          metadata.total_supplied.toLocaleString("en-US", {
                            maximumFractionDigits: 0,
                          })
                        }
                        style={{
                          fontSize: "1.3rem",
                          stroke: "white",
                          fill: "white",
                        }}
                        className={`${styles.label} ${styles.value}`}
                      />
                      <Label
                        position="center"
                        offset={0}
                        value={"Adjusted Supplied"}
                        style={{
                          fontSize: "1rem",
                          stroke: "transparent",
                          fill: "gray",
                          fontWeight: "100",
                        }}
                        className={`${styles.label} ${styles.title} ${styles.adjusted}`}
                      />
                      <Label
                        position="center"
                        offset={0}
                        value={
                          "$" +
                          metadata.adjusted_supply.toLocaleString("en-US", {
                            maximumFractionDigits: 0,
                          })
                        }
                        style={{
                          fontSize: "1rem",
                          stroke: "transparent",
                          fill: "gray",
                        }}
                        className={`${styles.label} ${styles.value} ${styles.adjusted}`}
                      />
                      {protocol.position.supplied.map((entry, index) => {
                        // Get random offset between 0 and pieColors length
                        const randomOffset = Math.floor(
                          Math.random() * pieColors.length
                        );

                        const color =
                          pieColors[(index + randomOffset) % pieColors.length];

                        return (
                          <Cell key={index} fill={color} stroke={"#00000000"} />
                        );
                      })}
                    </Pie>
                    <PieTooltip
                      cursor={{ fill: "rgba(0,0,0,0)" }}
                      content={<CustomTooltip />}
                      wrapperStyle={{ outline: "none" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.info}>
                  <div className={styles.positionInfo}>
                    <div className={styles.protocol}>
                      <Image
                        src={
                          `/protocolIcons/${protocol.protocol.name}.svg` ||
                          defaultImg
                        }
                        alt={""}
                        width={35}
                        height={35}
                      />
                      {protocolToTitle(protocol.protocol.protocol)}
                      <Image
                        src={
                          `/protocolTokenIcons/${protocol.protocol.chain}.svg` ||
                          defaultImg
                        }
                        alt={""}
                        width={35}
                        height={35}
                      />
                    </div>
                    <div className={styles.market}>{marketName} Market</div>
                    <div
                      className={getHealthFactorClass(
                        Number(roundedHealthFactor(metadata.health_factor)),
                        styles,
                        false
                      )}
                    >
                      <span>
                        {Number(roundedHealthFactor(metadata.health_factor)) ===
                        -1 ? (
                          <svg viewBox="0 0 24 24">
                            <path d="M18.6 6.62c-1.44 0-2.8.56-3.77 1.53L12 10.66 10.48 12h.01L7.8 14.39c-.64.64-1.49.99-2.4.99-1.87 0-3.39-1.51-3.39-3.38S3.53 8.62 5.4 8.62c.91 0 1.76.35 2.44 1.03l1.13 1 1.51-1.34L9.22 8.2C8.2 7.18 6.84 6.62 5.4 6.62 2.42 6.62 0 9.04 0 12s2.42 5.38 5.4 5.38c1.44 0 2.8-.56 3.77-1.53l2.83-2.5.01.01L13.52 12h-.01l2.69-2.39c.64-.64 1.49-.99 2.4-.99 1.87 0 3.39 1.51 3.39 3.38s-1.52 3.38-3.39 3.38c-.9 0-1.76-.35-2.44-1.03l-1.14-1.01-1.51 1.34 1.27 1.12c1.02 1.01 2.37 1.57 3.82 1.57 2.98 0 5.4-2.41 5.4-5.38s-2.42-5.37-5.4-5.37z"></path>
                          </svg>
                        ) : (
                          roundedHealthFactor(metadata.health_factor)
                        )}
                      </span>
                      {" Health Factor"}
                    </div>
                  </div>
                  <Link
                    className={styles.explorer}
                    href={`${protocol.protocol.explorer}/${address}`}
                    target="_blank"
                  >
                    View on Explorer
                    <svg x="0px" y="0px" viewBox="0 0 122.6 122.88">
                      <g>
                        <path d="M110.6,72.58c0-3.19,2.59-5.78,5.78-5.78c3.19,0,5.78,2.59,5.78,5.78v33.19c0,4.71-1.92,8.99-5.02,12.09 c-3.1,3.1-7.38,5.02-12.09,5.02H17.11c-4.71,0-8.99-1.92-12.09-5.02c-3.1-3.1-5.02-7.38-5.02-12.09V17.19 C0,12.48,1.92,8.2,5.02,5.1C8.12,2,12.4,0.08,17.11,0.08h32.98c3.19,0,5.78,2.59,5.78,5.78c0,3.19-2.59,5.78-5.78,5.78H17.11 c-1.52,0-2.9,0.63-3.91,1.63c-1.01,1.01-1.63,2.39-1.63,3.91v88.58c0,1.52,0.63,2.9,1.63,3.91c1.01,1.01,2.39,1.63,3.91,1.63h87.95 c1.52,0,2.9-0.63,3.91-1.63s1.63-2.39,1.63-3.91V72.58L110.6,72.58z M112.42,17.46L54.01,76.6c-2.23,2.27-5.89,2.3-8.16,0.07 c-2.27-2.23-2.3-5.89-0.07-8.16l56.16-56.87H78.56c-3.19,0-5.78-2.59-5.78-5.78c0-3.19,2.59-5.78,5.78-5.78h26.5 c5.12,0,11.72-0.87,15.65,3.1c2.48,2.51,1.93,22.52,1.61,34.11c-0.08,3-0.15,5.29-0.15,6.93c0,3.19-2.59,5.78-5.78,5.78 c-3.19,0-5.78-2.59-5.78-5.78c0-0.31,0.08-3.32,0.19-7.24C110.96,30.94,111.93,22.94,112.42,17.46L112.42,17.46z" />
                      </g>
                    </svg>
                  </Link>
                </div>
                <ResponsiveContainer
                  className={styles.chart}
                  width="100%"
                  height="100%"
                >
                  <PieChart width={400} height={400}>
                    <Pie
                      data={protocol.position.borrowed}
                      cx="50%"
                      cy="50%"
                      innerRadius={110}
                      outerRadius={140}
                      fill="#8884d8"
                      paddingAngle={0}
                      dataKey="value"
                      style={{ cursor: "pointer", outline: "none" }}
                    >
                      <Label
                        position="center"
                        offset={0}
                        value={"Borrowed"}
                        style={{
                          fontSize: "1rem",
                          stroke: "white",
                          fill: "white",
                          fontWeight: "100",
                        }}
                        className={`${styles.label} ${styles.title}`}
                      />
                      <Label
                        position="center"
                        offset={0}
                        value={
                          "$" +
                          metadata.total_borrowed.toLocaleString("en-US", {
                            maximumFractionDigits: 0,
                          })
                        }
                        style={{
                          fontSize: "1.3rem",
                          stroke: "white",
                          fill: "white",
                        }}
                        className={`${styles.label} ${styles.value}`}
                      />
                      <Label
                        position="center"
                        offset={0}
                        value={"Adjusted Borrowed"}
                        style={{
                          fontSize: "1rem",
                          stroke: "transparent",
                          fill: "gray",
                          fontWeight: "100",
                        }}
                        className={`${styles.label} ${styles.title} ${styles.adjusted}`}
                      />
                      <Label
                        position="center"
                        offset={0}
                        value={
                          "$" +
                          metadata.adjusted_borrow.toLocaleString("en-US", {
                            maximumFractionDigits: 0,
                          })
                        }
                        style={{
                          fontSize: "1rem",
                          stroke: "transparent",
                          fill: "gray",
                        }}
                        className={`${styles.label} ${styles.value} ${styles.adjusted}`}
                      />
                      {protocol.position.borrowed.map((entry, index) => {
                        // Get random offset between 0 and pieColors length
                        const randomOffset = Math.floor(
                          Math.random() * pieColors.length
                        );

                        const color =
                          pieColors[(index + randomOffset) % pieColors.length];

                        return (
                          <Cell key={index} fill={color} stroke={"#00000000"} />
                        );
                      })}
                    </Pie>
                    <PieTooltip
                      cursor={{ fill: "rgba(0,0,0,0)" }}
                      content={<CustomTooltip />}
                      wrapperStyle={{ outline: "none" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.correlationTable}>
                <div className={styles.title}>Correlation Table</div>
                <div className={styles.table}>
                  <div className={`${styles.row} ${styles.titleRow}`}>
                    <div className={styles.col}>
                      <span>Token Supplied</span>
                    </div>
                    <div className={styles.col}>
                      <span>Dollar Amount</span>
                    </div>
                    <div className={styles.col}>
                      <span>Balance</span>
                    </div>
                    <div className={styles.col}>
                      <span>Position Ratio</span>
                    </div>
                    <div className={styles.col}>
                      <Tooltip
                        label={
                          "'NA' means token doesn't have high correlation with any other tokens."
                        }
                        position="top"
                        withArrow
                        classNames={{
                          tooltip: styles.tooltip,
                        }}
                      >
                        <span>
                          High Correlation With
                          <svg
                            viewBox="0 0 24 24"
                            data-testid="InfoOutlinedIcon"
                          >
                            <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8"></path>
                          </svg>
                        </span>
                      </Tooltip>
                    </div>
                    <div className={styles.col}>
                      <span>Liquidation Fee</span>
                    </div>
                  </div>
                  {protocol.position.supplied.map((token, index) => {
                    if (!token.value) {
                      return <></>;
                    }

                    const tokenSymbol = getTokenSymbol(token.symbol);

                    const formattedValue = token.value
                      ? token.value.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })
                      : 0;

                    const formattedBalance = token.balance
                      ? token.balance.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })
                      : 0;

                    let ratio = (
                      (token.value * 100) /
                      metadata.total_supplied
                    ).toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    });
                    if (Number(ratio) > 100) ratio = "100";

                    if ((token.value * 100) / metadata.total_supplied < 0.01) {
                      return <></>;
                    }

                    return (
                      <div className={styles.row} key={index}>
                        <div className={styles.col}>
                          <Image
                            src={
                              tokenIcons[tokenSymbol]
                                ? tokenIcons[tokenSymbol]
                                : defaultImg
                            }
                            width={20}
                            height={20}
                            alt={tokenSymbol}
                          />
                          {tokenSymbol}
                        </div>
                        <div className={styles.col}>${formattedValue}</div>
                        <div className={styles.col}>
                          {formattedBalance} {getTokenSymbol(token.symbol)}
                        </div>
                        <div className={styles.col}>{ratio}%</div>
                        <div className={styles.col}>
                          {getTokensWithHighCorrelation(
                            token,
                            protocol,
                            covarianceMatrix
                          ).join(", ")}
                        </div>
                        <div className={styles.col}>
                          $
                          {getLiquidationFee(token, protocol, covarianceMatrix)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {protocol.position.borrowed.length > 0 && (
                  <div className={styles.table}>
                    <div className={`${styles.row} ${styles.titleRow}`}>
                      <div className={styles.col}>
                        <span>Token Borrowed</span>
                      </div>
                      <div className={styles.col}>
                        <span>Dollar Amount</span>
                      </div>
                      <div className={styles.col}>
                        <span>Balance</span>
                      </div>
                      <div className={styles.col}>
                        <span>Position Ratio</span>
                      </div>
                      <div className={styles.col}>
                        <Tooltip
                          label={
                            "'NA' means token doesn't have high correlation with any other tokens."
                          }
                          position="top"
                          withArrow
                          classNames={{
                            tooltip: styles.tooltip,
                          }}
                        >
                          <span>
                            High Correlation With
                            <svg
                              viewBox="0 0 24 24"
                              data-testid="InfoOutlinedIcon"
                            >
                              <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8"></path>
                            </svg>
                          </span>
                        </Tooltip>
                      </div>
                      <div className={styles.col}></div>
                    </div>
                    {protocol.position.borrowed.map((token, index) => {
                      if (!token.value) {
                        return <></>;
                      }

                      const tokenSymbol = getTokenSymbol(token.symbol);

                      const formattedValue = token.value
                        ? token.value.toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })
                        : 0;

                      const formattedBalance = token.balance
                        ? token.balance.toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })
                        : 0;

                      let ratio = (
                        (token.value * 100) /
                        metadata.total_borrowed
                      ).toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      });
                      if (Number(ratio) > 100) ratio = "100";

                      if (
                        (token.value * 100) / metadata.total_borrowed <
                        0.01
                      ) {
                        return <></>;
                      }

                      return (
                        <div className={styles.row} key={index}>
                          <div className={styles.col}>
                            <Image
                              src={
                                tokenIcons[tokenSymbol]
                                  ? tokenIcons[tokenSymbol]
                                  : defaultImg
                              }
                              width={20}
                              height={20}
                              alt={tokenSymbol}
                            />
                            {tokenSymbol}
                          </div>
                          <div className={styles.col}>${formattedValue}</div>
                          <div className={styles.col}>
                            {formattedBalance} {getTokenSymbol(token.symbol)}
                          </div>
                          <div className={styles.col}>{ratio}%</div>
                          <div className={styles.col}>
                            {getTokensWithHighCorrelation(
                              token,
                              protocol,
                              covarianceMatrix
                            ).join(", ")}
                          </div>
                          <div className={styles.col}></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className={styles.summary}>
                <div className={styles.title}>Position Summary</div>
                <div className={styles.description}>
                  Based on{" "}
                  <span>
                    {formatAddress(address)}
                    {"'"}s
                  </span>{" "}
                  holdings over the past <span>{lookBack}</span> days, the
                  probability of liquidation in the next{" "}
                  <span>{lookForward}</span> days is
                  <span> {formattedProbability}</span>, and the time to reach a{" "}
                  <span>{probabilityCutoff * 100}%</span> probability of
                  liquidation is <span>{formattedDaysToLiquidation}</span> days.
                  The total liquidation fee of{" "}
                  <span>
                    {formatAddress(address)}
                    {"'"}s
                  </span>{" "}
                  position is{" "}
                  <span>
                    ${getTotalLiquidationFee(protocol, covarianceMatrix)}
                  </span>
                  . Based on the total supplied multiplied by the probability of
                  liquidation, the expected value at risk is{" "}
                  <span>
                    {"$" +
                      (
                        riskProfile[
                          `${protocol.protocol.protocol}-${protocol.market}`
                        ].probability *
                        protocol.metadata[protocol.market].total_supplied
                      ).toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}
                  </span>
                  .
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}
