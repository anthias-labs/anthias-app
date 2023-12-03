"use server";

import { redirect } from "next/navigation";

export default async function CompoundV3Redirect() {
  return redirect(
    "/protocols/compound/compound_v3_ethereum/positions/table?sort=total_borrowed&limit=10&paginate=1%2C10"
  );
}
