import type { TaasGeometry, TaasKind, TaasZone } from "./types";

/**
 * 한국도로교통공단(TAAS) 사고다발지역 공개 API (공공데이터포털)
 *  - 지자체별 사고다발지역: {base}/frequentzoneLg/getRestFrequentzoneLg
 *  - 결빙 사고다발지역   : {base}/frequentzoneFreezing/getRestFrequentzoneFreezing
 * 요청: ServiceKey, searchYearCd, siDo, guGun, type, numOfRows, pageNo
 * 응답: spot_nm, sido_sgg_nm, occrrnc_cnt, caslt_cnt, dth_dnv_cnt, se_dnv_cnt, sl_dnv_cnt,
 *       wnd_dnv_cnt, lo_crd(경도), la_crd(위도), geom_json(폴리곤, EPSG:4326)
 */
const BASE = process.env.TAAS_BASE_URL || "https://apis.data.go.kr/B552061";

const ENDPOINT: Record<TaasKind, string> = {
  all: "frequentzoneLg/getRestFrequentzoneLg",
  freezing: "frequentzoneFreezing/getRestFrequentzoneFreezing",
};

export class TaasError extends Error {}

export function hasTaasKey(): boolean {
  return Boolean(process.env.TAAS_SERVICE_KEY);
}

/** 공공데이터포털 키는 Encoding/Decoding 두 형태가 있다. 어느 쪽을 넣어도 한 번만 인코딩한다. */
function encodedKey(): string {
  const key = process.env.TAAS_SERVICE_KEY ?? "";
  return /%[0-9A-Fa-f]{2}/.test(key) ? key : encodeURIComponent(key);
}

/** 강원(42→51)·전북(45→52) 특별자치도 개편, 군위(경북→대구) 이동에 대비한 대체 코드 */
function codeVariants(siDo: string, guGun: string): [string, string][] {
  const list: [string, string][] = [[siDo, guGun]];
  if (siDo === "42") list.push(["51", guGun]);
  if (siDo === "51") list.push(["42", guGun]);
  if (siDo === "45") list.push(["52", guGun]);
  if (siDo === "52") list.push(["45", guGun]);
  if (siDo === "47" && guGun === "720") list.push(["27", "720"]);
  if (siDo === "27" && guGun === "720") list.push(["47", "720"]);
  return list;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

function extractItems(json: Json): Json[] {
  const candidates = [
    json?.items?.item,
    json?.items,
    json?.response?.body?.items?.item,
    json?.response?.body?.items,
    json?.body?.items?.item,
    json?.item,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
    if (c && typeof c === "object" && ("spot_nm" in c || "afos_id" in c)) return [c];
  }
  return [];
}

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseGeometry(raw: unknown): TaasGeometry | null {
  let g: Json = raw;
  if (typeof g === "string") {
    try {
      g = JSON.parse(g);
    } catch {
      return null;
    }
  }
  if (g?.type === "Feature") g = g.geometry;
  if (g?.type === "FeatureCollection") g = g.features?.[0]?.geometry;
  if (g && (g.type === "Polygon" || g.type === "MultiPolygon") && Array.isArray(g.coordinates)) {
    return { type: g.type, coordinates: g.coordinates };
  }
  return null;
}

export function parseZones(json: Json, kind: TaasKind, year: number): TaasZone[] {
  const out: TaasZone[] = [];
  for (const it of extractItems(json)) {
    const lat = Number(it.la_crd);
    const lng = Number(it.lo_crd);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    out.push({
      id: `${kind}-${year}-${it.afos_fid ?? it.afos_id ?? it.spot_cd ?? out.length}`,
      kind,
      year,
      name: String(it.spot_nm ?? "지점명 없음"),
      region: String(it.sido_sgg_nm ?? ""),
      lat,
      lng,
      occurrences: toNum(it.occrrnc_cnt ?? it.occrmc_cnt),
      casualties: toNum(it.caslt_cnt),
      deaths: toNum(it.dth_dnv_cnt),
      serious: toNum(it.se_dnv_cnt),
      minor: toNum(it.sl_dnv_cnt),
      reported: toNum(it.wnd_dnv_cnt),
      geometry: parseGeometry(it.geom_json),
    });
  }
  return out;
}

async function callOnce(kind: TaasKind, year: number, siDo: string, guGun: string): Promise<TaasZone[]> {
  const url =
    `${BASE}/${ENDPOINT[kind]}?ServiceKey=${encodedKey()}` +
    `&searchYearCd=${year}&siDo=${siDo}&guGun=${guGun}&type=json&numOfRows=100&pageNo=1`;

  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  const text = await res.text();

  // 게이트웨이 오류(키 미등록 등)는 type=json 이어도 XML 로 올 수 있다.
  if (text.trimStart().startsWith("<")) {
    const msg = /<returnAuthMsg>([^<]*)</.exec(text)?.[1] ?? /<errMsg>([^<]*)</.exec(text)?.[1] ?? /<resultMsg>([^<]*)</.exec(text)?.[1];
    if (/<returnReasonCode>|<errMsg>|<OpenAPI_ServiceResponse>/.test(text)) {
      throw new TaasError(`공공데이터포털 응답 오류: ${msg ?? "알 수 없는 오류"}`);
    }
    throw new TaasError("예상하지 못한 XML 응답을 받았습니다.");
  }
  if (!res.ok) throw new TaasError(`TAAS API HTTP ${res.status}`);

  let json: Json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new TaasError("JSON 응답을 해석하지 못했습니다.");
  }
  return parseZones(json, kind, year);
}

/**
 * 최신 공표 연도부터 최대 3년 거슬러 올라가며 조회한다 (공표가 1~2년 늦다).
 * year 를 지정하면 그 해만 조회한다.
 */
export async function fetchTaasZones(
  kind: TaasKind,
  siDo: string,
  guGun: string,
  year?: number,
): Promise<{ year: number; zones: TaasZone[] }> {
  const thisYear = new Date().getFullYear();
  const years = year ? [year] : [thisYear - 1, thisYear - 2, thisYear - 3];
  let lastError: unknown = null;
  for (const y of years) {
    for (const [sd, gg] of codeVariants(siDo, guGun)) {
      try {
        const zones = await callOnce(kind, y, sd, gg);
        if (zones.length > 0) return { year: y, zones };
      } catch (e) {
        lastError = e;
        // 키·권한 오류는 다른 연도로 재시도해도 같으므로 즉시 중단
        if (e instanceof TaasError && /응답 오류/.test(e.message)) throw e;
      }
    }
  }
  if (lastError) throw lastError;
  return { year: years[years.length - 1], zones: [] };
}
