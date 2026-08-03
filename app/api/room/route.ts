import { NextRequest, NextResponse } from "next/server";
import { createRoom, getRoom, updateRoom, generateRoomCode, type RoomData } from "@/app/lib/room-store";

// POST: 创建或加入房间
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, code: inputCode, data } = body as {
      action: "create" | "join";
      code?: string;
      data?: RoomData;
    };

    if (action === "create") {
      // 创建新房间，生成唯一码
      let code = inputCode || generateRoomCode();
      let existing = await getRoom(code);
      // 如果码已存在，重新生成（最多 5 次）
      let attempts = 0;
      while (existing && attempts < 5) {
        code = generateRoomCode();
        existing = await getRoom(code);
        attempts++;
      }

      const roomData: RoomData = data || { taggedSections: {}, updatedAt: Date.now() };
      await createRoom(code, roomData);
      return NextResponse.json({ code, data: roomData });
    }

    if (action === "join") {
      if (!inputCode) {
        return NextResponse.json({ error: "缺少房间码" }, { status: 400 });
      }
      const roomData = await getRoom(inputCode.toUpperCase());
      if (!roomData) {
        return NextResponse.json({ error: "房间不存在或已过期" }, { status: 404 });
      }
      return NextResponse.json({ code: inputCode.toUpperCase(), data: roomData });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// GET: 获取房间数据
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "缺少房间码" }, { status: 400 });
  }
  const roomData = await getRoom(code.toUpperCase());
  if (!roomData) {
    return NextResponse.json({ error: "房间不存在或已过期" }, { status: 404 });
  }
  return NextResponse.json({ code: code.toUpperCase(), data: roomData });
}

// PUT: 更新房间数据
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, data } = body as { code: string; data: RoomData };
    if (!code || !data) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }
    const existing = await getRoom(code.toUpperCase());
    if (!existing) {
      return NextResponse.json({ error: "房间不存在或已过期" }, { status: 404 });
    }
    await updateRoom(code.toUpperCase(), { ...data, updatedAt: Date.now() });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
