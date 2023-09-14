"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function fetchProtocolNumAddresses(protocol: string) {
  const supabase = createServerActionClient({ cookies });

  let query = supabase
    .from(`${protocol}_addresses`)
    .select("*", { count: "exact", head: true });

  const { data, error, status, count } = await query;

  if (error) {
    console.log(error);
    return [];
  }

  return count;
}
