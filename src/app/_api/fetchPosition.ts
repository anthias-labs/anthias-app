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
      .ilike("address", `%${address}%`);

    const { data: positionData, error: positionError } = await positionQuery;

    if (positionError) {
      console.log(positionError);
      return null;
    }

    if (positionData && positionData.length > 0) {
      let position = positionData[0];
      position["protocol"] = protocol;

      let tokenQuery = supabase
        .from(`${protocol.protocol}_balances`)
        .select("*")
        .ilike("address", `%${address}%`);

      const { data: tokenData, error: tokenError } = await tokenQuery;

      if (tokenError) {
        console.log(tokenError);
        return null;
      }

      if (tokenData && tokenData.length > 0) {
        position["position"] = {};
        position["position"]["supplied"] = [];
        position["position"]["borrowed"] = [];
        position["position"]["lent"] = [];

        for (const token of tokenData) {
          if (token.type === "Supplied") {
            position["position"]["supplied"].push(token);
          } else if (token.type === "Borrowed") {
            position["position"]["borrowed"].push(token);
          } else if (token.type === "Lent") {
            position["position"]["lent"].push(token);
          }
        }

        retData.push(position);
      }
    }
  }

  return retData;
}
