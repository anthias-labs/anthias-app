"use server";

import { redirect } from "next/navigation";

export default async function ExactlyRedirect() {
  return redirect(
    "/protocols/exactly/exactly_v1_optimism/positions/table?sort=total_borrowed&limit=10&paginate=1%2C10"
  );
}
