"use server";

export default async function fetchCoinGeckoTokenIcon(token: string) {
  try {
    const axios = require("axios");
    const url = `https://api.coingecko.com/api/v3/coins/${token}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`;
    const config = {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    };

    let res;
    await axios.get(url, config).then((response) => {
      res = response.data;
    });

    return res.image.large;
  } catch (err) {
    console.log(err);
  }
}
