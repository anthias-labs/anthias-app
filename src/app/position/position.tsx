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
} from "../_utils/textHandling";
import { useRouter } from "next/navigation";
import { Loader } from "@mantine/core";

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
  const [address, setAddress] = useState("");
  const [tokenIcons, setTokenIcons] = useState({});
  const [lookBack, setLookBack] = useState(180); // Default 180 days
  const [lookForward, setLookForward] = useState(30); // Default 30 days
  const [alpha, setAlpha] = useState(0.05); // Default 5%
  const [riskProfile, setRiskProfile] = useState({});
  const router = useRouter();

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

    const lookForward = searchParams.lookForward || 30;
    setLookForward(lookForward);
    const lookBack = searchParams.lookBack || 180;
    setLookBack(lookBack);
    const alpha = searchParams.alpha || 0.05;
    setAlpha(alpha);

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

      const riskProfile = newPosition
        .map((protocol) => {
          const protocolRiskProfile = analyzePosition(
            covarianceMatrices[
              `${protocol.protocol.name}-v${protocol.protocol.version}-${protocol.protocol.chain}`
            ],
            protocol,
            lookForward
          );

          return {
            [`${protocol.protocol.name}-v${protocol.protocol.version}-${protocol.protocol.chain}`]:
              protocolRiskProfile,
          };
        })
        .reduce((acc, cur) => {
          return { ...acc, ...cur };
        });
      setRiskProfile(riskProfile);

      // Getting token icons
      fetchTokenIcons(tokenArray, false, false).then((icons) => {
        setTokenIcons(icons);
      });
    }
  }, [searchParams]);

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
    // console.log("correlation protocol", protocol);
    // console.log("correlation token", tokenA);
    // console.log("covariance matrix", covarianceMatrix);

    if (!protocol.token_array) {
      return ["NA"];
    }

    let highCorrelationTokens = [];

    const tokenAIndex =
      2 * covarianceMatrix.indexToToken[getTokenSymbol(tokenA.symbol)];

    protocol.token_array.forEach((tokenB) => {
      console.log("tokenB", tokenB);
      if (tokenB === tokenA.symbol) {
        return;
      }

      const tokenBIndex =
        2 * covarianceMatrix.indexToToken[getTokenSymbol(tokenB)];

      const correlation =
        covarianceMatrix.correlation[tokenAIndex][tokenBIndex];

      // console.log(tokenA.symbol, tokenAIndex, tokenB, tokenBIndex, correlation);

      // If absolute value of correlation is greater than 0.75
      if (Math.abs(correlation) > 0.75) {
        highCorrelationTokens.push(getTokenSymbol(tokenB));
      }
    });

    return highCorrelationTokens.length === 0 ? ["NA"] : highCorrelationTokens;
  }

  function analyzePosition(covarianceMatrix, protocol, lookForward) {
    let positionVector = {};
    const total = protocol.total_supplied + protocol.total_borrowed;
    const difference = protocol.total_supplied - protocol.total_borrowed;
    let positionVariance = 0;
    let positionMeanReturn = 0;

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

    return {
      probability: probability,
    };
  }

  function getZScore(total, difference, variance, meanReturn, lookForward) {
    return (
      (Math.log((total - difference) / total) -
        (meanReturn - variance / 2) * lookForward) /
      Math.sqrt(variance * lookForward)
    );
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
          console.log("mapping protocol", protocol);
          const covarianceMatrix =
            covarianceMatrices[
              `${protocol.protocol.name}-v${protocol.protocol.version}-${protocol.protocol.chain}`
            ];

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
                      dataKey="balance"
                      // onClick={() => {
                      //   window.open(
                      //     `https://app.euler.finance/account/0?spy=${walletData.address}`,
                      //     "_blank"
                      //   );
                      // }}
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
                          protocol.total_supplied.toLocaleString("en-US", {
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
                  <div
                    className={getHealthFactorClass(
                      Number(roundedHealthFactor(protocol.health_factor)),
                      styles,
                      false
                    )}
                  >
                    <span>
                      {Number(roundedHealthFactor(protocol.health_factor)) ===
                      -1 ? (
                        <svg viewBox="0 0 24 24">
                          <path d="M18.6 6.62c-1.44 0-2.8.56-3.77 1.53L12 10.66 10.48 12h.01L7.8 14.39c-.64.64-1.49.99-2.4.99-1.87 0-3.39-1.51-3.39-3.38S3.53 8.62 5.4 8.62c.91 0 1.76.35 2.44 1.03l1.13 1 1.51-1.34L9.22 8.2C8.2 7.18 6.84 6.62 5.4 6.62 2.42 6.62 0 9.04 0 12s2.42 5.38 5.4 5.38c1.44 0 2.8-.56 3.77-1.53l2.83-2.5.01.01L13.52 12h-.01l2.69-2.39c.64-.64 1.49-.99 2.4-.99 1.87 0 3.39 1.51 3.39 3.38s-1.52 3.38-3.39 3.38c-.9 0-1.76-.35-2.44-1.03l-1.14-1.01-1.51 1.34 1.27 1.12c1.02 1.01 2.37 1.57 3.82 1.57 2.98 0 5.4-2.41 5.4-5.38s-2.42-5.37-5.4-5.37z"></path>
                        </svg>
                      ) : (
                        roundedHealthFactor(protocol.health_factor)
                      )}
                    </span>
                    {" Health Factor"}
                  </div>
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
                      dataKey="balance"
                      // onClick={() => {
                      //   window.open(
                      //     `https://app.euler.finance/account/0?spy=${walletData.address}`,
                      //     "_blank"
                      //   );
                      // }}
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
                          protocol.total_borrowed.toLocaleString("en-US", {
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
                      <span>Position Ratio</span>
                    </div>
                    <div className={styles.col}>
                      <span>High Correlation With</span>
                    </div>
                    <div className={styles.col}>
                      <span>Liquidation Fee</span>
                    </div>
                  </div>
                  {protocol.position.supplied.map((token, index) => {
                    console.log("supplied token", token);
                    const tokenSymbol = getTokenSymbol(token.symbol);

                    const value = token.value
                      ? token.value.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })
                      : 0;

                    const ratio = token.value
                      ? (
                          (token.value * 100) /
                          protocol.total_supplied
                        ).toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })
                      : 0;

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
                        <div className={styles.col}>${value}</div>
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
                        <span>Position Ratio</span>
                      </div>
                      <div className={styles.col}>
                        <span>High Correlation With</span>
                      </div>
                      <div className={styles.col}></div>
                    </div>
                    {protocol.position.borrowed.map((token, index) => {
                      const tokenSymbol = getTokenSymbol(token.symbol);

                      const value = token.value
                        ? token.value.toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })
                        : 0;

                      const ratio = token.value
                        ? (
                            (token.value * 100) /
                            protocol.total_borrowed
                          ).toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })
                        : 0;

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
                          <div className={styles.col}>${value}</div>
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
            </div>
          );
        })}
    </div>
  );
}
