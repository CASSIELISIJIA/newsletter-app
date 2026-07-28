import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 访问密码保护：未登录的访客会被重定向到 /access 页面
export function proxy(request: NextRequest) {
  const token = request.cookies.get("access-token")?.value;
  const accessPage = new URL("/access", request.url);

  if (!token || token !== "granted") {
    return NextResponse.redirect(accessPage);
  }

  return NextResponse.next();
}

export const config = {
  // 排除 /access 页面、/api 接口和静态资源
  matcher: ["/((?!access|api|_next/static|_next/image|favicon.ico).*)"],
};
