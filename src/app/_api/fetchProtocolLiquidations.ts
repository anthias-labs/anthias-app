"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function fetchProtocolLiquidations(
  protocol: string,
  params
) {
  const supabase = createServerActionClient({ cookies });

  let positionQuery = supabase.from(`${protocol}_liquidations`).select("*");

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
    positionQuery = positionQuery.range(0, 9);
  }

  const { data: positionData, error: positionError } = await positionQuery;

  if (positionError) {
    console.log(positionError);
    return null;
  }

  return positionData;
}