"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function fetchNumData(protocol: string) {
  const supabase = createServerActionClient({ cookies });

  let count;

  if (protocol === "tokens") {
    const { data, error } = await supabase.from("_tokens").select("*");

    if (error) {
      console.log(error);
      return 0;
    }

    // Create a set to store unique underlying_symbols
    const uniqueSymbols = new Set(data.map((item) => item.underlying_symbol));
    count = uniqueSymbols.size;
  } else {
    const {
      data,
      error,
      count: fetchedCount,
    } = await supabase
      .from(`${protocol}_addresses`)
      .select("*", { count: "exact", head: true });

    if (error) {
      console.log(error);
      return 0;
    }

    count = fetchedCount;
  }

  return count;
}
