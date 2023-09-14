"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function fetchAggregateData(protocol: string) {
  const supabase = createServerActionClient({ cookies });

  let query = supabase
    .from(`${protocol}_aggregate`)
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(1);

  const { data, error } = await query;

  if (error) {
    console.log(error);
    return null;
  }

  return data[0];
}
