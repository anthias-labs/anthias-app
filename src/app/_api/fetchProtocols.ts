"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

import fetchAggregateData from "./fetchAggregateData";

export default async function fetchProtocols(protocol?: string) {
  const supabase = createServerActionClient({ cookies });

  let query = supabase.from("_protocols").select("*");

  if (protocol) {
    query = query.eq("protocol", protocol);
  }

  const { data, error } = await query;

  if (error) {
    console.log(error);
    return null;
  }

  if (data) {
    const enrichedData = await Promise.all(
      data.map(async (protocol) => {
        const aggregateData = await fetchAggregateData(protocol.protocol);
        return {
          ...protocol,
          aggregate: aggregateData,
        };
      })
    );

    return enrichedData;
  }

  return null;
}
