"use client";

import styles from "./page.module.scss";

import fetchProtocols from "@/app/_api/fetchProtocols";
import fetchProtocolIcons from "@/app/_api/fetchProtocolIcons";
import fetchCoinGeckoHistoricalPrices from "@/app/_api/fetchCoinGeckoHistoricalPrices";
import fetchCoinGeckoTokenIcon from "@/app/_api/fetchCoinGeckoTokenIcon";
import blobToBase64 from "@/app/_api/blobToBase64";
import fetchAddress from "@/app/_api/fetchAddress";
import { useEffect, useState } from "react";
import {
  titleCase,
  moneyToRoundedString,
  getHealthFactorClass,
  roundedHealthFactor,
  getTokenSymbol,
  tokenSymbolToCoinGeckoId,
} from "@/app/_utils/textHandling";
import Image from "next/image";
import Link from "next/link";
import { Loader } from "@mantine/core";
import defaultImg from "@/assets/icons/defaultProtocol.svg";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LabelList,
  Tooltip as PieTooltip,
} from "recharts";

// 0xcfcca7aea9e403744858c53e13adf8975db9038b

export default function Wallet({ params }) {
  const address = params.address;
  const [addressData, setAddressData] = useState(null);
  const [protocols, setProtocols] = useState([]);
  const [protocolIcons, setProtocolIcons] = useState([]);
  const [loading, setLoading] = useState(false);

  const pieColors = [
    "#1FCFCF",
    "#98DA8B",
    "#F5CB39",
    "#F2516A",
    "#EE40BD",
    "#73A2D5",
  ];

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const protocols: any = await fetchProtocols();
        setProtocols(protocols);

        const addressData = await fetchAddress(address, protocols);
        setAddressData(addressData);

        const protocolIcons = await fetchProtocolIcons(protocols);
        const protocolIconsBase64Promises = protocolIcons.map(
          (protocolIcon) => {
            return blobToBase64(protocolIcon);
          }
        );
        const protocolIconsBase64 = await Promise.all(
          protocolIconsBase64Promises
        );
        setProtocolIcons(protocolIconsBase64);
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  function CustomToolTip(props) {
    const { active, payload } = props;

    if (active && payload && payload.length) {
      const symbol = getTokenSymbol(payload[0].payload.symbol);

      return (
        <div className={styles.tooltip}>
          <div className={styles.tooltipTitle}>{symbol}</div>
          <div className={styles.tooltipContent}>
            <div className={styles.tooltipLine}>% of Position</div>
            <div className={styles.tooltipLine}>
              ${moneyToRoundedString(payload[0].payload.balance)}
            </div>
            <div
              className={`${styles.tooltipLine} ${styles.bottom}`}
            >{`(123 ${symbol})`}</div>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <div className={styles.wallet}>
      <div className={styles.title}>
        Displaying Risk Profile for <span>{address}</span>
      </div>

      {!loading && addressData ? (
        addressData.map((position, index) => {
          console.log(
            tokenSymbolToCoinGeckoId(
              getTokenSymbol(position.position.supplied[0].symbol)
            ),
            10
          );

          return (
            <div className={styles.position} key={index}>
              <div className={styles.positionTitle}>
                <Image
                  src={protocolIcons[index] || defaultImg}
                  alt={defaultImg}
                  width={32}
                  height={32}
                  className={styles.protocolIcon}
                />
                {titleCase(position.protocol.name)}{" "}
                {titleCase(position.protocol.version)}
              </div>
              <div className={styles.positionMakeup}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={position.position.supplied}
                      dataKey="balance"
                      cx="50%"
                      cy="50%"
                      innerRadius={110}
                      outerRadius={140}
                      fill="#8884d8"
                      paddingAngle={0}
                      style={{ cursor: "pointer", outline: "none" }}
                    >
                      <LabelList
                        position="center"
                        content={() => (
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                              fontSize: "1rem",
                              stroke: "white",
                              fontWeight: "100",
                            }}
                          >
                            <tspan
                              x="50%"
                              dy="-1.75rem"
                              style={{
                                stroke: "gray",
                              }}
                            >
                              Supplied
                            </tspan>
                            <tspan x="50%" dy="1.75rem">
                              {"$" +
                                moneyToRoundedString(position.total_supplied)}
                            </tspan>
                          </text>
                        )}
                      />
                      {position.position.supplied.map((entry, index) => {
                        const color = pieColors[index % pieColors.length];
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={color}
                            stroke={color}
                          />
                        );
                      })}
                    </Pie>
                    <PieTooltip
                      content={<CustomToolTip />}
                      cursor={{ fill: "rgba(0,0,0,0)" }}
                      wrapperStyle={{ outline: "none" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.centerLabel}>
                  <div className={styles.centerLabelTitle}>Health Factor</div>
                  <div
                    className={getHealthFactorClass(
                      Number(roundedHealthFactor(position.health_factor)),
                      styles
                    )}
                  >
                    <span>{roundedHealthFactor(position.health_factor)}</span>
                  </div>
                  <Link
                    href={`${protocols[index].info_page}/${address}`}
                    target="_blank"
                    style={{ textDecoration: "none" }}
                    className={styles.walletInfo}
                  >
                    Wallet Info
                    <svg viewBox="0 0 24 24">
                      <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"></path>
                    </svg>
                  </Link>
                </div>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={position.position.borrowed}
                      dataKey="balance"
                      cx="50%"
                      cy="50%"
                      innerRadius={110}
                      outerRadius={140}
                      fill="#8884d8"
                      paddingAngle={0}
                      style={{ cursor: "pointer", outline: "none" }}
                    >
                      <LabelList
                        position="center"
                        content={() => (
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                              fontSize: "1rem",
                              stroke: "white",
                              fontWeight: "100",
                            }}
                          >
                            <tspan
                              x="50%"
                              dy="-1.75rem"
                              style={{
                                stroke: "gray",
                              }}
                            >
                              Borrowed
                            </tspan>
                            <tspan x="50%" dy="1.75rem">
                              {"$" +
                                moneyToRoundedString(position.total_borrowed)}
                            </tspan>
                          </text>
                        )}
                      />
                      {position.position.supplied.map((entry, index) => {
                        const color = pieColors[index % pieColors.length];
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={color}
                            stroke={color}
                          />
                        );
                      })}
                    </Pie>
                    <PieTooltip
                      content={<CustomToolTip />}
                      cursor={{ fill: "rgba(0,0,0,0)" }}
                      wrapperStyle={{ outline: "none" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })
      ) : (
        <div className={styles.loaderContainer}>
          <Loader color="#1fcfcf" className={styles.loader} />
        </div>
      )}
    </div>
  );
}
