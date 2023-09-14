"use server";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function fetchReferralCodes(uid: string) {
  const supabase = createServerActionClient({ cookies });

  const { data, error } = await supabase
    .from("_referral_codes")
    .select("*")
    .eq("auth_uid", uid);

  if (error) {
    console.error(error);
  }

  return data[0];
}
