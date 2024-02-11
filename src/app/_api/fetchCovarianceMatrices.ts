"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function fetchCovarianceMatrices(
  protocols,
  numDays: number
) {
  const supabase = createServerActionClient({ cookies });

  let matrices = {};

  await Promise.all(
    protocols.map(async (protocol) => {
      const { data, error } = await supabase
        .from("_covariance_matrices")
        .select("matrix")
        .eq("protocol", protocol.name)
        .eq("version", protocol.version)
        .eq("chain", protocol.chain)
        .eq("num_days", numDays)
        .single();

      if (!error) {
        matrices[`${protocol.name}-${protocol.version}-${protocol.chain}`] =
          data.matrix;
      } else {
        console.error(error);
      }
    })
  );

  return matrices;
}
