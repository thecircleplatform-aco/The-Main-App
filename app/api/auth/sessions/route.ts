import { NextResponse } from "next/server";
import { getSession } from "@/auth/services/sessionService";
import {
  listSessionsForUser,
  parseDeviceNameForDisplay,
} from "@/auth/services/sessionRecordService";

export async function GET() {
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await listSessionsForUser(session.sub);
  const currentSessionId = session.sessionId;

  const sessions = rows.map((row) => {
    const { browser, os } = parseDeviceNameForDisplay(row.device_name);
    return {
      id: row.id,
      deviceName: row.device_name ?? "Unknown device",
      browser,
      os,
      ipAddress: row.ip_address ?? undefined,
      createdAt: row.created_at,
      lastActive: row.last_active,
      isCurrent: currentSessionId ? row.id === currentSessionId : false,
    };
  });

  return NextResponse.json({ sessions });
}
