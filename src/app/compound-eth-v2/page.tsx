"use server";

import { redirect } from "next/navigation";

export default async function CompoundV2Redirect() {
  return redirect(
    "/protocols/compound/compound_v2_ethereum/positions/table?sort=total_borrowed&limit=10&paginate=1%2C10"
  );
}
