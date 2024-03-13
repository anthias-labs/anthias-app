"use client";

import styles from "./filters.module.scss";

import defaultImg from "@/assets/icons/defaultProtocol.svg";
import {
  ActionIcon,
  Select,
  Button,
  Popover,
  Checkbox,
  RangeSlider,
} from "@mantine/core";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getTokenSymbol } from "../_utils/textHandling";
import fetchNumData from "../_api/fetchNumData";
import fetchProtocols from "../_api/fetchProtocols";
import fetchProtocolIcons from "../_api/fetchProtocolIcons";
import fetchTokenIcons from "../_api/fetchTokenIcons";
import blobToBase64 from "../_api/blobToBase64";
import fetchProtocolMarkets from "../_api/fetchProtocolMarketsClient";
import Image from "next/image";

export default function FilterBar({
  protocol,
  showProtocol = false,
  showTokens = false,
}) {
  const defaultFilters = {
    sort: "total_borrowed",
    limit: 10,
    paginate: [1, 10],
    tokens: [],
    health_factor: [],
  };

  const [filters, setFilters] = useState(defaultFilters);
  const [sortMode, setSortMode] = useState("Total Borrowed");
  const [numData, setNumData] = useState(0);
  const [protocols, setProtocols] = useState([]);
  const [selectedProtocols, setSelectedProtocols] = useState([]);
  const [search, setSearch] = useState("");
  const [healthFactorRange, setHealthFactorRange] = useState([0, 5]);
  const [markets, setMarkets] = useState([]);
  const [tokenIcons, setTokenIcons] = useState({});

  const router = useRouter();
  const currentPath = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchProtocolsInfo() {
      const protocols: any = await fetchProtocols();

      const protocolIcons = await fetchProtocolIcons(protocols);
      const protocolIconsBase64Promises = protocolIcons.map((protocolIcon) => {
        return blobToBase64(protocolIcon);
      });
      const protocolIconsBase64 = await Promise.all(
        protocolIconsBase64Promises
      );

      let tempSelectedProtocols = [];
      const protocolValues = protocols.map((protocol, index) => {
        tempSelectedProtocols.push(protocol.name);
        return {
          name: protocol.name,
          image: protocolIconsBase64[index],
        };
      });

      const protocolValuesUnique = protocolValues.filter(
        (protocol, index) =>
          protocolValues.findIndex((p) => p.name === protocol.name) === index
      );
      const tempSelectedProtocolsUnique = tempSelectedProtocols.filter(
        (protocol, index) =>
          tempSelectedProtocols.findIndex((p) => p === protocol) === index
      );

      setProtocols(protocolValuesUnique);
      setSelectedProtocols(tempSelectedProtocolsUnique);
    }

    async function fetchTokensInfo() {
      const markets = await fetchProtocolMarkets(protocol);
      setMarkets(markets);

      // get an array of each market.underlying_symbol
      const tokensArray = markets.map((market) => market.underlying_symbol);
      // Getting token icons
      fetchTokenIcons(tokensArray, false, false).then((icons) => {
        setTokenIcons(icons);
      });
    }

    showProtocol && fetchProtocolsInfo();
    showTokens && fetchTokensInfo();
  }, []);

  useEffect(() => {
    let tempFilters = { ...defaultFilters };

    const keys = Array.from(searchParams.keys());

    for (const field of keys) {
      const values: any[] = searchParams.getAll(field)[0].split(",");

      if (field === "sort") {
        values[0] === "total_supplied" && setSortMode("Total Supplied");
        values[0] === "total_borrowed" && setSortMode("Total Borrowed");
        tempFilters[field] = values[0];
      } else if (field === "limit") {
        tempFilters[field] = Number(values[0]);
      } else if (field === "paginate") {
        tempFilters[field] = values.map(Number);
      } else if (field === "search") {
        setSearch(values[0]);
        tempFilters[field] = values[0];
      } else if (field === "tokens") {
        tempFilters[field] = values;
      } else if (field === "health_factor") {
        tempFilters[field] = values.map(Number);
        values.map(Number).length > 1
          ? setHealthFactorRange(values.map(Number))
          : setHealthFactorRange([0, 5]);
      }
    }

    setFilters(tempFilters);

    // If keys don't include filters, set to default
    if (
      !keys.includes("sort") ||
      !keys.includes("limit") ||
      !keys.includes("paginate")
    ) {
      updateQueryParams(tempFilters);
      return;
    }

    async function fetchNumDataOnEffect() {
      const count = (await fetchNumData(protocol)) as number;
      setNumData(count);
    }

    fetchNumDataOnEffect();
  }, [searchParams]);

  function updateSortMode(mode) {
    let modeValue = null;

    if (mode === "Total Supplied") {
      modeValue = "total_supplied";
    } else if (mode === "Total Borrowed") {
      modeValue = "total_borrowed";
    }

    let tempFilters = { ...filters };
    tempFilters.sort = modeValue;
    setFilters(tempFilters);

    updateQueryParams(tempFilters);
  }

  function updateHealthFactorRange(range) {
    let tempFilters = { ...filters };

    if (range[0] === 0 && range[1] === 5) {
      tempFilters.health_factor = [];
    } else {
      tempFilters.health_factor = range;
    }

    setFilters(tempFilters);

    updateQueryParams(tempFilters);
  }

  function updateLimit(limit) {
    let tempFilters = { ...filters };
    tempFilters.limit = Number(limit);
    tempFilters.paginate[1] = tempFilters.paginate[0] + tempFilters.limit - 1;
    setFilters(tempFilters);

    updateQueryParams(tempFilters);
  }

  function updateTokens(tokens) {
    let tempFilters = { ...filters };
    tempFilters.tokens = tokens;
    setFilters(tempFilters);

    updateQueryParams(tempFilters);
  }

  function updatePaginate(direction) {
    let tempFilters = { ...filters };

    if (tempFilters.paginate[0] === 1 && direction === "left") {
      return;
    }

    if (direction === "left") {
      tempFilters.paginate[0] -= tempFilters.limit;
      tempFilters.paginate[1] -= tempFilters.limit;

      if (tempFilters.paginate[0] < 1) {
        tempFilters.paginate[0] = 1;
        tempFilters.paginate[1] = tempFilters.limit;
      }
    }

    if (direction === "right") {
      tempFilters.paginate[0] += tempFilters.limit;
      tempFilters.paginate[1] += tempFilters.limit;

      if (tempFilters.paginate[1] > numData) {
        tempFilters.paginate[0] = numData - tempFilters.limit + 1;
        tempFilters.paginate[1] = numData;
      }
    }

    setFilters(tempFilters);

    updateQueryParams(tempFilters);
  }

  function updateSearch(name: string) {
    let newParams = new URLSearchParams(searchParams.toString());

    if (name === "") {
      newParams.delete("search");
    } else {
      newParams.set("search", name);
    }

    router.push(`${currentPath}?${newParams.toString()}`, {
      scroll: false,
    });
  }

  function updateQueryParams(filters) {
    let newParams = new URLSearchParams();

    if (filters.sort) {
      newParams.set("sort", filters.sort);
    }

    newParams.set("limit", filters.limit);
    newParams.set("paginate", filters.paginate.join(","));
    newParams.set("tokens", filters.tokens.join(","));
    newParams.set("health_factor", filters.health_factor.join(","));

    router.push(`${currentPath}?${newParams.toString()}`, { scroll: false });
  }

  return (
    <div className={styles.filters}>
      <div className={styles.search}>
        <div className={styles.left}>
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              updateSearch(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateSearch(search);
              }
              if (e.key === "Escape") {
                setSearch("");
                updateSearch("");
              }
            }}
            onBlur={() => {
              updateSearch(search);
            }}
          />
        </div>
        <div className={styles.right}>
          {search.length === 0 ? (
            <svg viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              onClick={() => {
                setSearch("");
                updateSearch("");
              }}
            >
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
            </svg>
          )}
        </div>
      </div>
      <Popover
        classNames={{
          dropdown: styles.popoverDropdown,
        }}
      >
        <Popover.Target>
          <Button
            className={styles.filterTarget}
            classNames={{
              root: styles.filterTargetRoot,
              inner: styles.filterTargetInner,
            }}
          >
            <svg
              width="18"
              height="20"
              viewBox="0 0 18 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11.2497 9.99864V18.753C11.2947 19.0863 11.1822 19.4418 10.9235 19.6751C10.8194 19.7781 10.6958 19.8598 10.5597 19.9156C10.4237 19.9713 10.2778 20 10.1305 20C9.98315 20 9.83728 19.9713 9.7012 19.9156C9.56512 19.8598 9.44152 19.7781 9.33745 19.6751L7.07652 17.4421C6.95384 17.3236 6.86055 17.1788 6.80396 17.0188C6.74738 16.8588 6.72901 16.6881 6.75031 16.52V9.99864H6.71657L0.237463 1.79976C0.0547977 1.56815 -0.0276246 1.27456 0.00820636 0.983122C0.0440373 0.691686 0.195208 0.426105 0.428687 0.244411C0.642407 0.0888768 0.878625 0 1.12609 0H16.8739C17.1214 0 17.3576 0.0888768 17.5713 0.244411C17.8048 0.426105 17.956 0.691686 17.9918 0.983122C18.0276 1.27456 17.9452 1.56815 17.7625 1.79976L11.2834 9.99864H11.2497Z" />
            </svg>
            Filters
          </Button>
        </Popover.Target>
        <Popover.Dropdown className={styles.filterDropdown}>
          {/* {showProtocol && (
            <div className={styles.filter}>
              <Popover position="top">
                <Popover.Target>
                  <Button className={styles.button}>Protocols</Button>
                </Popover.Target>
                <Popover.Dropdown className={styles.dropdown}>
                  <div className={`${styles.popover} ${styles.protocols}`}>
                    {protocols.map((protocol, index) => {
                      return (
                        <div
                          className={
                            selectedProtocols.includes(protocol.name)
                              ? `${styles.protocol} ${styles.selected}`
                              : `${styles.protocol}`
                          }
                          key={index}
                          onClick={() => {
                            let tempSelectedProtocols = [...selectedProtocols];

                            if (!selectedProtocols.includes(protocol.name)) {
                              tempSelectedProtocols.push(protocol.name);
                            } else {
                              tempSelectedProtocols =
                                tempSelectedProtocols.filter(
                                  (selectedProtocol) =>
                                    selectedProtocol !== protocol.name
                                );
                            }

                            setSelectedProtocols(tempSelectedProtocols);
                          }}
                        >
                          <Checkbox
                            classNames={{
                              input: styles.checkboxInput,
                            }}
                            checked={selectedProtocols.includes(protocol.name)}
                          />
                          <div className={styles.protocolInfo}>
                            <Image
                              src={protocol.image}
                              alt="protocol"
                              width={28}
                              height={28}
                            />
                            <div className={styles.protocolName}>
                              {titleCase(protocol.name)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Popover.Dropdown>
              </Popover>
            </div>
          )} */}
          <div
            className={styles.section}
            style={{
              zIndex: 1000,
            }}
          >
            {protocol !== "tokens" && (
              <div className={styles.filter}>
                Sort:
                <Select
                  classNames={{
                    input: styles.selectInput,
                    dropdown: styles.selectDropdown,
                    item: styles.selectItem,
                  }}
                  style={{ width: "9.5rem" }}
                  placeholder="Sort Mode"
                  data={["Total Supplied", "Total Borrowed"]}
                  value={sortMode}
                  maxDropdownHeight={200}
                  onChange={(value) => {
                    setSortMode(value);
                    updateSortMode(value);
                  }}
                />
              </div>
            )}
            <div className={styles.filter}>
              Amount:
              <Select
                classNames={{
                  input: styles.selectInput,
                  dropdown: styles.selectDropdown,
                  item: styles.selectItem,
                }}
                style={{ width: "5.5rem" }}
                data={["10", "25", "50", "100", "500", "1000"]}
                value={filters.limit.toString()}
                maxDropdownHeight={200}
                onChange={(value) => updateLimit(value)}
              />
            </div>
          </div>
          {showTokens && (
            <div className={`${styles.section} ${styles.tokens}`}>
              <div className={styles.side}>
                <span className={styles.title}>Supplied Tokens</span>
                <div className={styles.scrollBox}>
                  {markets.map((market, index) => {
                    return (
                      <div
                        key={index}
                        className={styles.token}
                        onClick={() => {
                          let tempSelectedTokens = [...filters.tokens];

                          if (
                            !filters.tokens.includes(
                              `Supplied ${market.underlying_symbol}`
                            )
                          ) {
                            tempSelectedTokens.push(
                              `Supplied ${market.underlying_symbol}`
                            );
                          } else {
                            tempSelectedTokens = tempSelectedTokens.filter(
                              (selectedToken) =>
                                selectedToken !==
                                `Supplied ${market.underlying_symbol}`
                            );
                          }

                          updateTokens(tempSelectedTokens);
                        }}
                      >
                        <Checkbox
                          classNames={{
                            input: styles.checkboxInput,
                          }}
                          checked={filters.tokens.includes(
                            `Supplied ${market.underlying_symbol}`
                          )}
                          size={"xs"}
                        />
                        <Image
                          src={
                            tokenIcons[
                              getTokenSymbol(market.underlying_symbol)
                            ] || defaultImg
                          }
                          alt="token"
                          width={22}
                          height={22}
                        />
                        {getTokenSymbol(market.underlying_symbol)}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className={styles.side}>
                <span className={styles.title}>Borrowed Tokens</span>
                <div className={styles.scrollBox}>
                  {markets.map((market, index) => {
                    return (
                      <div
                        key={index}
                        className={styles.token}
                        onClick={() => {
                          let tempSelectedTokens = [...filters.tokens];

                          if (
                            !filters.tokens.includes(
                              `Borrowed ${market.underlying_symbol}`
                            )
                          ) {
                            tempSelectedTokens.push(
                              `Borrowed ${market.underlying_symbol}`
                            );
                          } else {
                            tempSelectedTokens = tempSelectedTokens.filter(
                              (selectedToken) =>
                                selectedToken !==
                                `Borrowed ${market.underlying_symbol}`
                            );
                          }

                          updateTokens(tempSelectedTokens);
                        }}
                      >
                        <Checkbox
                          classNames={{
                            input: styles.checkboxInput,
                          }}
                          checked={filters.tokens.includes(
                            `Borrowed ${market.underlying_symbol}`
                          )}
                          size={"xs"}
                        />
                        <Image
                          src={
                            tokenIcons[
                              getTokenSymbol(market.underlying_symbol)
                            ] || defaultImg
                          }
                          alt="token"
                          width={22}
                          height={22}
                        />
                        {getTokenSymbol(market.underlying_symbol)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <div className={styles.section}>
            <div className={styles.filter}>
              Health Factor:
              <RangeSlider
                classNames={{
                  root: styles.rangeSlider,
                  bar: styles.rangeSliderBar,
                  thumb: styles.rangeSliderThumb,
                  track: styles.rangeSliderTrack,
                }}
                color="#1fcfcf"
                label={(value) => {
                  if (value === 5) return "inf";

                  return `${value.toFixed(1)}`;
                }}
                min={0}
                max={5}
                step={0.1}
                minRange={0.3}
                size={"sm"}
                thumbSize={12}
                value={[healthFactorRange[0], healthFactorRange[1]]}
                onChange={(value) => {
                  setHealthFactorRange(value);
                }}
                onChangeEnd={(value) => {
                  updateHealthFactorRange(value);
                }}
              />
            </div>

            <div className={styles.filter}>
              <Button
                className={styles.button}
                onClick={() => {
                  updateQueryParams(defaultFilters);
                  setHealthFactorRange([0, 5]);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </Popover.Dropdown>
      </Popover>
      <div className={styles.paginate}>
        <div className={`${styles.filter} ${styles.pageLabel}`}>
          {filters.paginate[0]} - {filters.paginate[1]} of {numData}
        </div>
        <div className={styles.filter}>
          <ActionIcon
            className={styles.actionIcon}
            onClick={() => updatePaginate("left")}
          >
            <svg viewBox="0 0 24 24">
              <path
                d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"
                fill="white"
              ></path>
            </svg>
          </ActionIcon>
          <ActionIcon
            className={styles.actionIcon}
            onClick={() => updatePaginate("right")}
          >
            <svg viewBox="0 0 24 24">
              <path
                d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
                fill="white"
              ></path>
            </svg>
          </ActionIcon>
        </div>
      </div>
    </div>
  );
}
