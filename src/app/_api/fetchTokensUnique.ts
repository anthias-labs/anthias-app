"use server";

interface DataPoint {
  token_symbol: string;
  underlying_symbol: string;
  protocol: string;
  version: string;
  chain: string;
  price: number;
  protocol_full?: string;
  protocol_names?: Set<string>;
  protocols?: Set<string>;
  underlying_address?: string;
  lowest_borrow_rate: {
    rate: number;
    protocol_name: string;
    protocol_full: string;
  };
  highest_supply_rate: {
    rate: number;
    protocol_name: string;
    protocol_full: string;
  };
  highest_collateral_factor: {
    rate: number;
    protocol_name: string;
    protocol_full: string;
  };
  borrow_rate: number;
  supply_rate: number;
  collateral_factor: number;
}

function updateRates(dataPoint: DataPoint, transformedDataEntry: DataPoint) {
  const protocol_full = `${dataPoint.protocol}_v${dataPoint.version}_${dataPoint.chain}`;

  // Update lowest_borrow_rate
  if (dataPoint.borrow_rate < transformedDataEntry.lowest_borrow_rate.rate) {
    transformedDataEntry.lowest_borrow_rate = {
      rate: dataPoint.borrow_rate,
      protocol_name: dataPoint.protocol,
      protocol_full,
    };
  }
  // Update highest_supply_rate
  if (dataPoint.supply_rate > transformedDataEntry.highest_supply_rate.rate) {
    transformedDataEntry.highest_supply_rate = {
      rate: dataPoint.supply_rate,
      protocol_name: dataPoint.protocol,
      protocol_full,
    };
  }
  // Update highest_collateral_factor
  if (
    dataPoint.collateral_factor >
    transformedDataEntry.highest_collateral_factor.rate
  ) {
    transformedDataEntry.highest_collateral_factor = {
      rate: dataPoint.collateral_factor,
      protocol_name: dataPoint.protocol,
      protocol_full,
    };
  }
}

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function fetchTokensUnique(token?: string) {
  const supabase = createServerActionClient({ cookies });

  let query = supabase.from("_tokens").select("*").limit(1000);

  if (token) {
    query = query.eq("token_symbol", token);
  }

  let { data, error } = await query;

  if (error) {
    console.log(error);
    return [];
  }

  if (data) {
    let transformedData: { [key: string]: DataPoint } = {};

    data.forEach((dataPoint: DataPoint) => {
      const protocol_full = `${dataPoint.protocol}_v${dataPoint.version}_${dataPoint.chain}`;

      if (transformedData[dataPoint.token_symbol]) {
        transformedData[dataPoint.token_symbol].protocol_names!.add(
          dataPoint.protocol
        );
        transformedData[dataPoint.token_symbol].protocols!.add(protocol_full);

        updateRates(dataPoint, transformedData[dataPoint.token_symbol]);
      } else {
        transformedData[dataPoint.token_symbol] = {
          ...dataPoint,
          protocol_names: new Set([dataPoint.protocol]),
          protocols: new Set([protocol_full]),
          lowest_borrow_rate: {
            rate: dataPoint.borrow_rate,
            protocol_name: dataPoint.protocol,
            protocol_full,
          },
          highest_supply_rate: {
            rate: dataPoint.supply_rate,
            protocol_name: dataPoint.protocol,
            protocol_full,
          },
          highest_collateral_factor: {
            rate: dataPoint.collateral_factor,
            protocol_name: dataPoint.protocol,
            protocol_full,
          },
        };
      }
    });

    data = Object.values(transformedData).map((item) => {
      return {
        token_symbol: item.token_symbol,
        underlying_symbol: item.underlying_symbol,
        price: item.price,
        underlying_address: item.underlying_address,

        lowest_borrow_rate: item.lowest_borrow_rate,
        highest_supply_rate: item.highest_supply_rate,
        highest_collateral_factor: item.highest_collateral_factor,

        protocol_names: Array.from(item.protocol_names!),
        protocols: Array.from(item.protocols!),
      };
    });
  }

  return data;
}
