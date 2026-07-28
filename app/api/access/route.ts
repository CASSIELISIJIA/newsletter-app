import { NextResponse } from "next/server";

// 验证访问密码，成功后设置 cookie
export async function POST(request: Request) {
  const { password } = await request.json();
  const accessPassword = process.env.ACCESS_PASSWORD || "news2026";

  if (password === accessPassword) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("access-token", "granted", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  }

  return NextResponse.json({ error: "密码错误" }, { status: 401 });
}
