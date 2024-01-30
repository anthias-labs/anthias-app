"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

interface DataPoint {
  symbol: string;
  type: "Supplied" | "Borrowed";
  balance: number;
}

interface TransformedDataEntry {
  underlying_symbol: string;
  total_supplied: number;
  total_borrowed: number;
}

export default async function fetchProtocolMarkets(
  protocol: string,
  params
): Promise<TransformedDataEntry[] | null> {
  const supabase = createServerActionClient({ cookies });
  let transformedData: { [underlying_symbol: string]: TransformedDataEntry } =
    {};

  let query = supabase
    .from(`${protocol}_balances`)
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1000);

  let { data, error } = await query;

  if (error) {
    console.log(error);
    return null;
  }

  if (data) {
    data.forEach((dataPoint: DataPoint) => {
      if (!transformedData[dataPoint.symbol]) {
        transformedData[dataPoint.symbol] = {
          underlying_symbol: dataPoint.symbol,
          total_supplied: 0,
          total_borrowed: 0,
        };
      }

      if (dataPoint.type === "Supplied") {
        transformedData[dataPoint.symbol].total_supplied += dataPoint.balance;
      } else if (dataPoint.type === "Borrowed") {
        transformedData[dataPoint.symbol].total_borrowed += dataPoint.balance;
      }
    });

    data = Object.values(transformedData).map((item) => {
      return {
        underlying_symbol: item.underlying_symbol,
        name: item.underlying_symbol,
        total_supplied: item.total_supplied,
        total_borrowed: item.total_borrowed,
      };
    });
  }

  return data;
}
