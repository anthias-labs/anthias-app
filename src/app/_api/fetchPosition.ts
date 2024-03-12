"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function fetchPosition(address, protocols) {
  const supabase = createServerActionClient({ cookies });
  let retData = [];

  for (let i = 0; i < protocols.length; i++) {
    const protocol = protocols[i];

    let positionQuery = supabase
      .from(`${protocol.protocol}_addresses`)
      .select("*")
      .eq("address", address);

    const { data: positionData, error: positionError } = await positionQuery;

    if (positionError) {
      console.log(positionError);
      return null;
    }

    if (positionData && positionData.length > 0) {
      let marketPositions = [];

      let tokenQuery = supabase
        .from(`${protocol.protocol}_balances`)
        .select("*")
        .eq("address", address);

      const { data: tokenData, error: tokenError } = await tokenQuery;

      if (tokenError) {
        console.log(tokenError);
        return null;
      }

      if (tokenData && tokenData.length > 0) {
        for (const token of tokenData) {
          const market = token.metadata.market;
          const isNewMarket = !marketPositions.some((p) => p.market === market);
          let position = null;

          if (isNewMarket) {
            let newPosition = {
              ...positionData[0],
              market: market,
              protocol: protocol,
              position: {
                supplied: [],
                borrowed: [],
              },
            };

            position = newPosition;
          } else {
            position = marketPositions.find((p) => p.market === market);
          }

          if (token.type === "Supplied") {
            position["position"]["supplied"].push(token);
          } else if (token.type === "Borrowed") {
            position["position"]["borrowed"].push(token);
          }

          // If the position is not already in the list, add it
          if (isNewMarket) {
            marketPositions.push(position);
          } else {
            // Else replace it
            const index = marketPositions.findIndex((p) => p.market === market);
            marketPositions[index] = position;
          }
        }

        retData = [...retData, ...marketPositions];
      }
    }
  }

  return retData;
}
