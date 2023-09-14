"use server";

import { headers } from "next/headers";

export default async function getIsMobile() {
  const headersList = headers();
  const userAgent = headersList.get("user-agent");

  const isMobile = userAgent!.match(
    /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
  );

  return isMobile;
}
