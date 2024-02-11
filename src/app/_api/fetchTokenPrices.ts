"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function fetchTokenPrices() {
  const supabase = createServerActionClient({ cookies });

  let query = supabase.from("_tokens").select("*").limit(1000);

  let { data, error } = await query;

  if (error) {
    console.log(error);
    return null;
  }

  return data;
}
