import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { getSession } from "@/services/auth";
import { jwtVerify, SignJWT } from "jose";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

type TokenRequestBody = {
  room_id: string;
};

export async function POST(req: Request) {
  try {
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      return NextResponse.json(
        { error: "LiveKit is not configured on the server" },
        { status: 500 }
      );
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as TokenRequestBody | null;
    if (!body?.room_id) {
      return NextResponse.json({ error: "room_id is required" }, { status: 400 });
    }

    const roomRes = await query<{
      id: string;
      circle_id: string;
      status: string;
      livekit_room_name: string | null;
    }>("SELECT * FROM voice_rooms WHERE id = $1", [body.room_id]);
    const room = roomRes.rows[0];
    if (!room || room.status !== "live") {
      return NextResponse.json({ error: "Room not found or not live" }, { status: 404 });
    }

    const memberRes = await query<{ id: string }>(
      "SELECT id FROM circle_members WHERE circle_id = $1 AND user_id = $2",
      [room.circle_id, session.sub]
    );
    if (!memberRes.rows[0]) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const roomName = room.livekit_room_name ?? `voice_${room.id}`;
    const now = Math.floor(Date.now() / 1000);
    const ttl = 60 * 60;

    const token = await new SignJWT({
      sub: session.sub,
      video: {
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
      },
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt(now)
      .setExpirationTime(now + ttl)
      .setIssuer(LIVEKIT_API_KEY)
      .setAudience("livekit")
      .sign(new TextEncoder().encode(LIVEKIT_API_SECRET));

    return NextResponse.json({
      token,
      roomName,
      url: LIVEKIT_URL,
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }
}

