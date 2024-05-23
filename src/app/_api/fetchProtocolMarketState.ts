"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function fetchProtocolMarketState(
  protocol: string,
  params
) {
  const supabase = createServerActionClient({ cookies });

  let positionQuery = supabase.from(`${protocol}_market_state`).select("*");
  //   positionQuery = positionQuery.order("timestamp", { ascending: false });

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
    }
  }

  // If params don't contain paginate, set to default
  if (!keys.includes("paginate")) {
    positionQuery = positionQuery.range(0, 10);
  }

  const { data: marketStateData, error: marketStateError } =
    await positionQuery;

  if (marketStateError) {
    console.log(marketStateError);
    return null;
  }

  console.log(marketStateData)
  return marketStateData;
}
