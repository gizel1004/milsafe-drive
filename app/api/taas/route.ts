import { NextResponse } from "next/server";
import { fetchTaasZones, hasTaasKey, TaasError } from "@/lib/taas";
import type { TaasKind, TaasResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /api/taas?kind=all|freezing&siDo=42&guGun=780[&year=2024]  (인증키는 서버 환경변수로만 사용) */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const kind = (sp.get("kind") ?? "all") as TaasKind;
  const siDo = sp.get("siDo") ?? "";
  const guGun = sp.get("guGun") ?? "";
  const yearParam = sp.get("year");

  if (!["all", "freezing"].includes(kind) || !/^\d{2}$/.test(siDo) || !/^\d{3}$/.test(guGun) || (yearParam && !/^\d{4}$/.test(yearParam))) {
    return NextResponse.json<TaasResponse>({ configured: hasTaasKey(), zones: [], message: "요청 값이 올바르지 않습니다." }, { status: 400 });
  }

  if (!hasTaasKey()) {
    return NextResponse.json<TaasResponse>({
      configured: false,
      zones: [],
      message: "TAAS_SERVICE_KEY 환경변수가 설정되지 않았습니다. README의 'TAAS 연동' 절차를 참고하세요.",
    });
  }

  try {
    const { year, zones } = await fetchTaasZones(kind, siDo, guGun, yearParam ? Number(yearParam) : undefined);
    return NextResponse.json<TaasResponse>({
      configured: true,
      year,
      zones,
      message: zones.length === 0 ? "해당 지역·연도에 공표된 사고다발지역이 없습니다." : undefined,
    });
  } catch (e) {
    const message = e instanceof TaasError ? e.message : "TAAS 조회 중 오류가 발생했습니다.";
    return NextResponse.json<TaasResponse>({ configured: true, zones: [], message }, { status: 502 });
  }
}
