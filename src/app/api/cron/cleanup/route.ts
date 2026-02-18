import { NextRequest, NextResponse } from "next/server";
import adminDb from "@/utils/db-admin";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  const groupData = await adminDb.query({
    groups: {
      $: {
        where: {
          createdAt: { $lt: oneDayAgo },
        },
      },
    },
  });

  const groups = groupData.groups ?? [];

  if (groups.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  await adminDb.transact(
    groups.map((group) => adminDb.tx.groups[group.id]!.delete()),
  );

  return NextResponse.json({ deleted: groups.length });
}
