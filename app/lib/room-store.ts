import { kv } from "@vercel/kv";

// ============================================================
//  房间数据存储层
//  ----------------------------------------------------------
//  生产环境：使用 Vercel KV（Redis）
//  开发环境：降级为内存存储（重启后丢失，但不影响开发）
//  数据结构：room:{code} -> { taggedSections, updatedAt }
// ============================================================

const isKvConfigured = () => {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
};

// 本地内存降级存储
const memoryStore = new Map<string, { data: string; updatedAt: number }>();

export interface RoomData {
  taggedSections: Record<string, string>;
  updatedAt: number;
}

// 生成 6 位房间码（大写字母+数字，排除易混淆字符）
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// 创建房间
export async function createRoom(code: string, data: RoomData): Promise<void> {
  const payload = JSON.stringify(data);
  if (isKvConfigured()) {
    // 7 天过期，避免无限堆积
    await kv.set(`room:${code}`, payload, { ex: 7 * 24 * 60 * 60 });
  } else {
    memoryStore.set(`room:${code}`, { data: payload, updatedAt: Date.now() });
  }
}

// 获取房间数据
export async function getRoom(code: string): Promise<RoomData | null> {
  let payload: string | null = null;
  if (isKvConfigured()) {
    payload = await kv.get(`room:${code}`);
  } else {
    payload = memoryStore.get(`room:${code}`)?.data ?? null;
  }
  if (!payload) return null;
  try {
    return JSON.parse(payload) as RoomData;
  } catch {
    return null;
  }
}

// 更新房间数据
export async function updateRoom(code: string, data: RoomData): Promise<void> {
  const payload = JSON.stringify(data);
  if (isKvConfigured()) {
    await kv.set(`room:${code}`, payload, { ex: 7 * 24 * 60 * 60 });
  } else {
    memoryStore.set(`room:${code}`, { data: payload, updatedAt: Date.now() });
  }
}

// 检查 KV 是否可用（用于前端提示）
export function isCloudSyncAvailable(): boolean {
  return isKvConfigured();
}
