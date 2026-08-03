import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// 手动刷新：强制首页 ISR 缓存失效，触发重新抓取 RSS
// 配合 page.tsx 的 revalidate=300（5 分钟自动刷新），用户可随时手动触发
export async function POST() {
  revalidatePath("/");
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
