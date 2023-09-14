import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const headersList = request.headers;
  const userAgent = headersList.get("user-agent");

  const isMobile = userAgent!.match(
    /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
  );

  if (isMobile) {
    return NextResponse.redirect(new URL("/mobile", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!api|_next/static|_next/image|icon.svg|mobile).*)",
};
