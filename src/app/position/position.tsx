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
}) {
  const [position, setPosition] = useState(defaultPosition || []);
  const [address, setAddress] = useState("");
  const [tokenIcons, setTokenIcons] = useState({});
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

    if (defaultPosition) {
      let newPosition = defaultPosition;
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

        return protocol;
      });

      setPosition(newPosition);

      // Getting token icons
      const suppliedTokens = defaultPosition.map((protocol) => {
        return protocol.position.supplied.map((token) => {
          return token.symbol;
        });
      });

      const borrowedTokens = defaultPosition.map((protocol) => {
        return protocol.position.borrowed.map((token) => {
          return token.symbol;
        });
      });

      const tokenArray = [
        ...new Set(suppliedTokens.flat().concat(borrowedTokens.flat())),
      ];

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

    let tokenSymbol = getTokenSymbol(payload.symbol);

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
                    <span>{roundedHealthFactor(protocol.health_factor)}</span>
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
            </div>
          );
        })}
    </div>
  );
}
