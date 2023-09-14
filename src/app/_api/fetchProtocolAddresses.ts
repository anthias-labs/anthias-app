"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function fetchProtocolAddresses(protocol: string, params) {
  const supabase = createServerActionClient({ cookies });
  let retData = [];

  let positionQuery = supabase.from(`${protocol}_addresses`).select("*");

  let keys = [];

  for (const [index, entry] of params.entries()) {
    const [key, value] = entry;
    keys.push(key);

    if (key === "sort") {
      positionQuery = positionQuery.order(value, { ascending: false });
    } else if (key === "address") {
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
    positionQuery = positionQuery.range(0, 9);
  }

  const { data: positionData, error: positionError } = await positionQuery;

  if (positionError) {
    console.log(positionError);
    return null;
  }

  if (positionData && positionData.length > 0) {
    for (const position of positionData) {
      let tempPosition = position;

      // let tokenQuery = supabase
      //   .from(`${protocol}_balances`)
      //   .select("*")
      //   .ilike("address", `%${tempPosition.address}%`);

      // const { data: tokenData, error: tokenError } = await tokenQuery;

      // if (tokenError) {
      //   console.log(tokenError);
      //   return null;
      // }

      // if (tokenData && tokenData.length > 0) {
      //   tempPosition["position"] = {};
      //   tempPosition["position"]["supplied"] = [];
      //   tempPosition["position"]["borrowed"] = [];
      //   tempPosition["position"]["lent"] = [];

      //   for (const token of tokenData) {
      //     if (token.type === "Supplied") {
      //       tempPosition["position"]["supplied"].push(token);
      //     } else if (token.type === "Borrowed") {
      //       tempPosition["position"]["borrowed"].push(token);
      //     } else if (token.type === "Lent") {
      //       tempPosition["position"]["lent"].push(token);
      //     }
      //   }
      // }

      retData.push(tempPosition);
    }
  }

  return retData;
}
