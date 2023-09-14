"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function fetchSession() {
  const supabase = createServerActionClient({ cookies });

  const session = await supabase.auth.getSession();
  return session;
}
