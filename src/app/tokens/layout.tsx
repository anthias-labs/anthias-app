"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function TokensLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerActionClient({ cookies });
  const session = await supabase.auth.getSession();

  return session.data.session ? <>{children}</> : redirect("/account/signup");
}
