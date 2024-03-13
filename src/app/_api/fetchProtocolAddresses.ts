"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function fetchProtocolAddresses(protocol: string, params) {
  const supabase = createServerActionClient({ cookies });

  let positionQuery = supabase.from(`${protocol}_addresses`).select("*");

  // First loop through to see if tokens are present
  for (const [index, entry] of params.entries()) {
    const [key, value] = entry;
    if (key === "tokens" && value.length > 0) {
      const tokenArray = value.split(",").filter((token) => token.length > 0);
      positionQuery = supabase.rpc("filter_markets_by_token", {
        tname: protocol,
        tokens: tokenArray,
      });
    }
  }

  let keys = [];

  for (const [index, entry] of params.entries()) {
    const [key, value] = entry;

    keys.push(key);

    if (key === "sort") {
      positionQuery = positionQuery.order(value, { ascending: false });
    } else if (key === "search") {
      positionQuery = positionQuery.ilike("address", `%${value}%`);
    } else if (key === "paginate") {
      const values = value.split(",");

      const first = values[0] - 1;
      const last = values[1] - 1;

      if (last <= 999) {
        positionQuery = positionQuery.range(first, last);
      } else {
        positionQuery = positionQuery.range(first, 1000);
      }
    } else if (key === "health_factor") {
      const lower = value.split(",")[0];
      const upper = value.split(",")[1];

      positionQuery = positionQuery.gte("health_factor", lower);
      positionQuery = positionQuery.lte("health_factor", upper);
    }
  }

  // If params don't contain paginate, set to default
  if (!keys.includes("paginate")) {
    positionQuery = positionQuery.range(0, 9);
  }

  const { data: positionData, error: positionError } = await positionQuery;

  if (positionError) {
    console.log(positionError);
    return null;
  }

  return positionData;
}
