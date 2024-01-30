"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default async function fetchCovarianceMatrix(protocol, numDays) {
  const client = createClientComponentClient();
  const { data, error } = await client
    .from("covariance_matrix")
    .select("*")
    .eq("protocol", protocol)
    .eq("num_days", numDays);
  if (error) {
    console.error(error);
    return null;
  }
  return data[0];
}
