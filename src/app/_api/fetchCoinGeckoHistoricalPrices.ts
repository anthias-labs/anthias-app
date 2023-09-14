"use server";

export default async function fetchCoinGeckoHistoricalPrices(
  token: string,
  days?: number | string
) {
  try {
    let queryDays = days || "max";

    const axios = require("axios");
    const url = `https://api.coingecko.com/api/v3/coins/${token}/market_chart?vs_currency=usd&days=${queryDays}&interval=daily`;
    console.log(url);
    const config = {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    };

    let res;
    await axios.get(url, config).then((response) => {
      console.log(response);
      res = response.data;
    });

    return res.prices;
  } catch (err) {
    console.log(err);
  }
}
