import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** 관리자 승인 직후 지도·사례 페이지를 즉시 새로 그리게 한다 (관리자 코드 확인) */
export async function POST(req: Request) {
  let code = "";
  try {
    code = String((await req.json())?.code ?? "");
  } catch {
    /* 본문 없음 */
  }
  const sb = getSupabase();
  if (!sb || !code) return NextResponse.json({ ok: false }, { status: 400 });
  const { data, error } = await sb.rpc("admin_check", { p_code: code });
  if (error || data !== true) return NextResponse.json({ ok: false }, { status: 403 });
  revalidatePath("/");
  revalidatePath("/cases", "layout");
  return NextResponse.json({ ok: true });
}
