import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const headersList = req.headers;
  const userAgent = headersList.get("user-agent");
  const res = NextResponse.next();
  // const supabase = createMiddlewareClient({ req, res });
  // const session = await supabase.auth.getSession();

  const isMobile = userAgent!.match(
    /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
  );

  if (isMobile) {
    return NextResponse.redirect(new URL("/mobile", req.url));
  }

  // if (!session.data.session) {
  //   return NextResponse.redirect(new URL("/account/signup", req.url));
  // }

  return res;
}

export const config = {
  matcher:
    "/((?!_api|_next/static|_next/image|.*\\..*|mobile|exactly|protocols/exactly/*|account).*)",
};
