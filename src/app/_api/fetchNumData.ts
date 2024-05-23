"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default async function fetchNumData(protocol: string, params = null) {
  const supabase = createClientComponentClient();

  let count;

  if (protocol === "tokens") {
    const { data, error } = await supabase.from("_tokens").select("*");

    if (error) {
      console.log(error);
      return 0;
    }

    // Create a set to store unique underlying_symbols
    const uniqueSymbols = new Set(data.map((item) => item.underlying_symbol));
    count = uniqueSymbols.size;
  } else {
    let numPositionQuery = supabase
      .from(`${protocol}_addresses`)
      .select("*", { count: "exact", head: true });
    let filteringTokens = false;

    if (params) {
      // Convert params to 2d
      params = Array.from(params.entries());
      // First loop through to see if tokens are present
      for (const [index, entry] of params.entries()) {
        const [key, value] = entry;
        if (key === "tokens" && value.length > 0) {
          filteringTokens = true;
          const tokenArray = value
            .split(",")
            .filter((token) => token.length > 0);
          numPositionQuery = supabase.rpc("filter_markets_by_token", {
            tname: protocol,
            tokens: tokenArray,
          });
        }
      }

      let keys = [];

      for (const [index, entry] of params.entries()) {
        const [key, value] = entry;

        keys.push(key);

        if (key === "search") {
          numPositionQuery = numPositionQuery.ilike("address", `%${value}%`);
        } else if (key === "health_factor" && value.split(",").length > 1) {
          const lower = value.split(",")[0];
          const upper = value.split(",")[1];

          numPositionQuery = numPositionQuery.gte("health_factor", lower);
          numPositionQuery = numPositionQuery.lte("health_factor", upper);
        }
      }
    }

    if (!filteringTokens) {
      const { data, error, count: fetchedCount } = await numPositionQuery;

      if (error) {
        console.log(error);
        return 0;
      }

      count = fetchedCount;
    } else {
      const { data, error } = await numPositionQuery;

      if (error) {
        console.log(error);
        return 0;
      }

      count = data.length;
    }
  }

  return count;
}
