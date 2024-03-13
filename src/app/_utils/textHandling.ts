export function moneyToRoundedString(num: number, digits: number = 0): string {
  const roundedNum = num.toFixed(digits);

  return parseFloat(roundedNum).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function roundedHealthFactor(num: number) {
  // always return 3 decimal places, for example 1.000
  let roundedNum = Math.round(num * 1000) / 1000;
  // convert to string
  let str = roundedNum.toString();
  // if str = "0", then change to "0.000"
  if (str === "0") {
    str = "0.000";
  }
  // if the string has less than 3 decimal places, add 0s
  if (str.split(".")[1]?.length < 3) {
    str += "0".repeat(3 - str.split(".")[1]?.length);
  }
  return str;
}

export function titleCase(str: string) {
  return str
    .split(" ")
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatAddress(address: string) {
  return address.slice(0, 6) + "..." + address.slice(-4);
}

export function snakeToTitleCase(str: string) {
  return titleCase(str.replace(/_/g, " "));
}

export function separateSnakeCase(str: string) {
  return str.split("_");
}

export function getHealthFactorClass(
  healthFactor: number,
  styles,
  isTable = true
) {
  if (healthFactor === -1 || healthFactor > 1.3) {
    return isTable
      ? `${styles.td} ${styles.healthFactor} ${styles.safe}`
      : `${styles.healthFactor} ${styles.safe}`;
  } else if (healthFactor > 1.1 && healthFactor <= 1.3) {
    return isTable
      ? `${styles.td} ${styles.healthFactor} ${styles.risky}`
      : `${styles.healthFactor} ${styles.risky}`;
  } else {
    return isTable
      ? `${styles.td} ${styles.healthFactor} ${styles.unsafe}`
      : `${styles.healthFactor} ${styles.unsafe}`;
  }
}

export function getTokenSymbol(symbol: string) {
  if (symbol.includes("Fraxlend") || symbol.includes("fFRAX")) {
    // String in form of "FraxlendV1 - WBTC/FRAX"... extract WBTC or in form of "fFRAX(sfrxETH)-16"... extract ETH

    if (symbol.includes(" - ")) {
      return symbol.split(" ")[2].split("/")[0];
    } else {
      // Split to get content within parenthesis
      let str = symbol.split("(")[1].split(")")[0];
      // Get uppercase letters
      return str.match(/[A-Z]/g).join("");
    }
  } else if (symbol === "WBTC2" || symbol === "cWBTC2") {
    return "WBTC";
  } else if (symbol[0] === "c") {
    return symbol.slice(1);
  } else if (symbol === "WBTC2") {
    return "WBTC";
  } else {
    return symbol;
  }
}

import coinGeckoMap from "./data/coinGeckoMap.json";

export function tokenSymbolToCoinGeckoId(symbol: string) {
  const lowerSymbol = symbol.toLowerCase();
  const token = coinGeckoMap.find((obj) => obj["symbol"] === lowerSymbol);
  return token ? token["id"] : undefined;
}

export function toCamelCase(str: string) {
  return str
    .split(" ")
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

export function toSnakeCase(str: string): string {
  return str
    .split(" ")
    .map((word) => word.toLowerCase())
    .join("_");
}

export function protocolToTitle(protocol: string): string {
  let title = snakeToTitleCase(protocol);
  let titleSplit = title.split(" ");
  titleSplit[1] = titleSplit[1].toLowerCase();
  titleSplit = [titleSplit[0], titleSplit[2], titleSplit[1]];
  return titleSplit.join(" ");
}

import crypto from "crypto";

export function getHash() {
  const randomData = crypto.randomBytes(21).toString("hex");
  const hash = crypto.createHash("sha256").update(randomData).digest("hex");
  return hash.substring(0, 16);
}

const marketMap = {
  "arbitrum-0x9c4ec768c28520b50860ea7a15bd7213a9ff58bf": "USDC",
  "base-0x46e6b214b524310239732d51387075e0e70970bf": "WETH",
  "ethereum-0xc3d688b66703497daa19211eedff47f25384cdc3": "USDC",
  "arbitrum-0xa5edbdd9646f8dff606d7448e414884c7d905dca": "USDC.e",
  "polygon-0xf25212e676d1f7f89cd72ffee66158f541246445": "USDC",
  "base-0x9c4ec768c28520b50860ea7a15bd7213a9ff58bf": "USDbC",
  "ethereum-0xa17581a9e3356d9a858b789d68b4d866e593ae94": "WETH",
};

export function getMarketSymbol(market: string) {
  return marketMap[market];
}

export function getMarkets() {
  // Returns an array of market getTokenSymbols
  const markets = Object.values(marketMap);
  const marketSymbols = markets.map((market) => getTokenSymbol(market));

  return [
    ...new Set(marketSymbols), // Remove duplicates
  ];
}
