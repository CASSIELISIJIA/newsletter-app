import { NextResponse } from "next/server";

// 处理密码验证：支持 JSON 和表单两种提交方式
export async function POST(request: Request) {
  let password = "";
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    password = body.password;
  } else {
    const formData = await request.formData();
    password = formData.get("password") as string;
  }

  const accessPassword = process.env.ACCESS_PASSWORD || "news2026";

  if (password === accessPassword) {
    const res = NextResponse.redirect(new URL("/", request.url), 302);
    res.cookies.set("access-token", "granted", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  }

  // 密码错误，重定向回 /access 并带错误标记
  const res = NextResponse.redirect(new URL("/access?error=1", request.url), 302);
  return res;
}
