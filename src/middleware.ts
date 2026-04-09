import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * 未ログイン時の `redirect(/admin/login?next=...)` に現在パスを渡すためのヘッダー。
 * （クライアントから偽装されないよう assert 側で /admin 配下のみ許可する）
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
