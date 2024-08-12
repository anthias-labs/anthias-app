"use client";

import styles from "./table.module.scss";
import Filters from "@/app/_components/filters";
import Exports from "./exports";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  moneyToRoundedString,
  roundedHealthFactor,
  getHealthFactorClass,
  toSnakeCase,
  formatAddress,
} from "@/app/_utils/textHandling";
import Link from "next/link";
import { Loader } from "@mantine/core";
import { motion } from "framer-motion";
import { titleCase } from "@/app/_utils/textHandling";
import Image from "next/image";
import defaultImg from "@/assets/icons/defaultProtocol.svg";
import { format } from 'date-fns';

export default function Table({
  tableProps,
  initialData = null,
  initialIcons = [],
}) {
  const currentPath = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState(initialData);
  const [icons, setIcons] = useState(initialIcons);
  const [sortMode, setSortMode] = useState(
    tableProps.defaultFilters ? tableProps.defaultFilters.sort : null
  );
  const tableRef = useRef();

  console.log("table props: ", tableProps);

  useEffect(() => {
    setSortMode(searchParams.getAll("sort")[0]);

    async function fetchData(searchParams) {
      if (tableProps.customData) {
        setData(tableProps.customData.data);
        fetchIcons(null);
        return;
      }

      let args = [...tableProps.dataFetch.args];
      if (tableProps.defaultFilters) {
        args.push(searchParams);
      }

      const data = await tableProps.dataFetch.function(...args);
      setData(data);

      if (tableProps.iconsFetch) {
        fetchIcons(data);
      }
    }

    async function fetchIcons(data) {
      if (tableProps.customData) {
        setIcons(tableProps.customData.icons);
        return;
      }

      const icons = await tableProps.iconsFetch.function(data);
      setIcons(icons);
    }

    fetchData(searchParams);
  }, [searchParams]);

  function updateSortMode(mode: string) {
    const modeValue = toSnakeCase(mode);
    if (tableProps.defaultFilters) {
      let newParams = new URLSearchParams(searchParams);
      newParams.set("sort", modeValue);
      router.push(`${currentPath}?${newParams.toString()}`);
    }
  }

  function renderIcon(icon) {
    return <Image src={icon || defaultImg} alt="icon" width={28} height={28} />;
  }

  return (
    <div className={styles.tableComponent} ref={tableRef}>
      <div className={styles.titleBar}>
        <div className={styles.section}>
          {tableProps.title}
          {tableProps.exports && (
            <Exports
              data={data}
              printRef={tableRef}
              csvFileName={
                tableProps.filters.protocol
                  ? tableProps.filters.protocol + "_data"
                  : "anthias_data"
              }
            />
          )}
        </div>
        <div className={styles.section}>
          {tableProps.filters && (
            <Filters
              sort={tableProps.filters.sort}
              protocol={tableProps.filters.protocol}
              showTokens={tableProps.filters.showTokens || false}
            />
          )}
        </div>
      </div>
      <div className={styles.container}>
        <div className={styles.table}>
          <div className={styles.thead}>
            <div className={styles.tr}>
              {tableProps.columns.labels.map((label, index) => {
                const key = tableProps.columns.keys[index];

                let className =
                  key === "address"
                    ? styles.address
                    : key === "total_supplied" || key === "total_borrowed"
                    ? styles.sortable
                    : styles.th;

                if (sortMode === key) {
                  className = `${styles.sortable} ${styles.active}`;
                }

                const onClickFunction = () => {
                  if (className === styles.sortable) {
                    updateSortMode(key);
                  }
                };

                return (
                  <div
                    key={index}
                    className={`${styles.th} ${className}`}
                    onClick={onClickFunction}
                  >
                    {label}
                    {className === styles.sortable ||
                      (className === `${styles.sortable} ${styles.active}` && (
                        <svg viewBox="0 0 24 24">
                          <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"></path>
                        </svg>
                      ))}
                  </div>
                );
              })}
              <div className={`${styles.th} ${styles.chevron}`} />
            </div>
          </div>
          {data ? (
            data.length > 0 ? (
              <div className={styles.tbody}>
                {data.map((data, dataIndex) => {
                  return (
                    <motion.div
                      initial={{ opacity: 0, x: -75 }}
                      animate={{
                        opacity: [0, 1],
                        x: [-75, 0],
                      }}
                      transition={{
                        duration: 0.1,
                        delay: dataIndex * 0.035,
                      }}
                      key={dataIndex}
                      className={styles.motion}
                    >
                      <Link
                        href={
                          tableProps.link.base ===
                          "https://app.anthias.xyz/position"
                            ? `/position?address=${data[tableProps.link.key]}`
                            : tableProps.link.base ===
                              "https://explorer.mode.network/tx/"
                            ? `${tableProps.link.base}/${data[
                                tableProps.link.key
                              ].slice(0, 66)}`
                            : `${tableProps.link.base}/${
                                data[tableProps.link.key]
                              }`
                        }
                        target={tableProps.link.newTab ? "_blank" : ""}
                        className={styles.tr}
                        style={{ textDecoration: "none" }}
                      >
                        {tableProps.columns.keys.map((key, columnIndex) => {
                          let value: any = data[key] ? data[key] : "";

                          if (key === "chain") {
                            value = titleCase(value) + " v" + data["version"];
                          } else if (
                            key === "token_symbol" ||
                            key === "underlying_symbol"
                          ) {
                            value = value.toUpperCase();
                          } else if (
                            key === "total_supplied" ||
                            key === "total_borrowed"
                          ) {
                            value = `$${moneyToRoundedString(Number(value))}`;
                          } else if (key === "price") {
                            value = `$${moneyToRoundedString(
                              Number(value),
                              2
                            )}`;
                          } else if (key === "highest_collateral_factor") {
                            value = `${(Number(value.rate) * 100).toFixed(1)}%`;
                          } else if (
                            key === "id" ||
                            key === "liquidator" ||
                            key === "borrower"
                          ) {
                            value = formatAddress(value);
                          } else if (
                            key === "supply_symbol" ||
                            key === "borrow_symbol"
                          ) {
                            value = value.toUpperCase();
                          } else if (key == "price_volatility") {
                            value = value + "%";
                          } else if (key == "risk_level") {
                            value = value + " / 100";
                          } else if (key == "risk_level") {
                            value = value + " / 100";
                          } else if (key == "timestamp") {
                            const timestamp = parseInt(value, 10); // Convert string to number
                            value =  format(new Date(timestamp * 1000), 'PPpp')
                          } else if (key === "debt_repaid") {
                            value = `$${moneyToRoundedString(
                              Number(value),
                              2
                            )}`;
                          } else {
                            value = titleCase(data[key].toString());
                          }

                          let className =
                            key === "address"
                              ? `${styles.td} ${styles.address}`
                              : key === "health_factor"
                              ? getHealthFactorClass(
                                  Number(
                                    roundedHealthFactor(data.health_factor)
                                  ),
                                  styles
                                )
                              : styles.td;

                          if (columnIndex === 0)
                            className = `${styles.first} ${className}`;

                          return (
                            <div key={columnIndex} className={className}>
                              {columnIndex === 0 ? (
                                <div className={styles.iconEntry}>
                                  {tableProps.iconsFetch &&
                                    renderIcon(icons[dataIndex])}
                                  <span>{value}</span>
                                </div>
                              ) : key === "health_factor" ? (
                                <span>
                                  {Number(
                                    roundedHealthFactor(data.health_factor)
                                  ) === -1 ? (
                                    <svg viewBox="0 0 24 24">
                                      <path d="M18.6 6.62c-1.44 0-2.8.56-3.77 1.53L12 10.66 10.48 12h.01L7.8 14.39c-.64.64-1.49.99-2.4.99-1.87 0-3.39-1.51-3.39-3.38S3.53 8.62 5.4 8.62c.91 0 1.76.35 2.44 1.03l1.13 1 1.51-1.34L9.22 8.2C8.2 7.18 6.84 6.62 5.4 6.62 2.42 6.62 0 9.04 0 12s2.42 5.38 5.4 5.38c1.44 0 2.8-.56 3.77-1.53l2.83-2.5.01.01L13.52 12h-.01l2.69-2.39c.64-.64 1.49-.99 2.4-.99 1.87 0 3.39 1.51 3.39 3.38s-1.52 3.38-3.39 3.38c-.9 0-1.76-.35-2.44-1.03l-1.14-1.01-1.51 1.34 1.27 1.12c1.02 1.01 2.37 1.57 3.82 1.57 2.98 0 5.4-2.41 5.4-5.38s-2.42-5.37-5.4-5.37z"></path>
                                    </svg>
                                  ) : (
                                    roundedHealthFactor(Number(value))
                                  )}
                                </span>
                              ) : key === "protocol_names" ? (
                                <div className={styles.protocolIconsEntry}>
                                  {data[key].map((protocolName, index) => {
                                    return (
                                      // <Link
                                      //   href={`/protocols/${protocolName}`}
                                      //   key={index}
                                      // >
                                      <Image
                                        key={index}
                                        src={
                                          tableProps.iconsFetch
                                            .protocolIconsObject[protocolName]
                                        }
                                        alt="icon"
                                        width={28}
                                        height={28}
                                        className={styles.protocolIcon}
                                      />
                                      // </Link>
                                    );
                                  })}
                                </div>
                              ) : key === "highest_collateral_factor" ? (
                                <div className={styles.iconEntry}>
                                  {value}
                                  <Image
                                    src={
                                      tableProps.iconsFetch.protocolIconsObject[
                                        data[key].protocol_name
                                      ] || defaultImg
                                    }
                                    alt="icon"
                                    width={28}
                                    height={28}
                                    className={styles.protocolIcon}
                                  />
                                </div>
                              ) : (
                                <>{value}</>
                              )}
                            </div>
                          );
                        })}

                        <div className={`${styles.td} ${styles.chevron}`}>
                          <svg
                            width="15"
                            height="26"
                            viewBox="0 0 15 26"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M2 24L13 13L2 2"
                              stroke="white"
                              strokeWidth="3.14268"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.error}>
                <p>No data found</p>
              </div>
            )
          ) : (
            <div className={styles.loading}>
              <Loader size="xl" color="#1fcfcf" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
