"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function fetchProtocolsUnique(protocol?: string) {
  const supabase = createServerActionClient({ cookies });

  let query = supabase.from("_protocols").select("*");

  if (protocol) {
    query = query.eq("protocol", protocol);
  }

  let { data, error } = await query;

  if (error) {
    console.log(error);
  }

  if (data) {
    data = data.reduce((acc, curr) => {
      if (!acc.some((x) => x.name === curr.name)) {
        acc.push(curr);
      }
      return acc;
    }, []);
  }

  return data;
}
