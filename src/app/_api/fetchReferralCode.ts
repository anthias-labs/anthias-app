"use server";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function fetchReferralCode(uid: string) {
  const supabase = createServerActionClient({ cookies });

  let retData = null;

  const { data: codeData, error: codeError } = await supabase
    .from("_referral_codes")
    .select("*")
    .eq("auth_uid", uid);

  if (codeError) {
    console.error(codeError);
  }

  if (codeData && codeData.length > 0) {
    retData = codeData[0];

    // Fetch the total number of users
    const { data: totalUserData, error: totalUserError } = await supabase
      .from("_referral_codes")
      .select("*");

    if (totalUserError) {
      console.error(totalUserError);
    } else {
      retData.total_users = totalUserData.length;
    }

    // Fetch the number of times the referral code has been used
    const { data: referralData, error: referralError } = await supabase
      .from("_referrals")
      .select("code")
      .eq("code", retData.code);

    if (referralError) {
      console.error(referralError);
    } else {
      retData.code_count =
        referralData.length < retData.max_count
          ? referralData.length
          : retData.max_count;
    }

    // Calculate anth_points
    retData.anth_points = retData.code_count * 10;

    // Check if the user signed up with a referral code
    const { data: referredData } = await supabase
      .from("_referrals")
      .select("referred_uid")
      .eq("referred_uid", uid);

    if (referredData && referredData.length > 0) {
      retData.anth_points += 10;
    }

    // Get the rank based on referral usage and also fetch total unique codes
    const { data: allReferralData, error: rankError } = await supabase
      .from("_referrals")
      .select("code");

    if (rankError) {
      console.error(rankError);
    } else {
      const codeCounts: { [code: string]: number } = {};
      allReferralData.forEach((referral) => {
        if (codeCounts[referral.code]) {
          codeCounts[referral.code]++;
        } else {
          codeCounts[referral.code] = 1;
        }
      });

      const sortedCodes = Object.entries(codeCounts)
        .sort((a, b) => b[1] - a[1])
        .map((entry) => entry[0]);
      retData.rank = sortedCodes.indexOf(retData.code) + 1; // +1 to get 1-based rank
    }
  }

  return retData;
}
