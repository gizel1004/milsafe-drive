export type Weather = "rain" | "snow" | "ice" | "fog" | "night" | "clear" | "unknown";
export type RoadType =
  | "highway"
  | "tunnel"
  | "curve"
  | "mountain"
  | "slope"
  | "bridge"
  | "underpass"
  | "urban"
  | "general";

export interface CaseItem {
  id: string;
  title: string;
  program: string;
  date: string | null; // 방송일 또는 기사일
  source_title: string;
  source_url: string;
  weather: Weather;
  road_type: RoadType;
  summary: string;
  cause: string | null;
  advice: string | null; // 방송/기사에 언급된 조언 (없으면 null)
  lesson: string; // 본 사이트의 교육 포인트
}

export interface Zone {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  road_type: RoadType;
  climates: Weather[];
  risk: 1 | 2 | 3 | 4 | 5;
  description: string;
  hazards: string[];
  prevention: string[];
  military_note: string;
  case_ids: string[];
  /** example = 교육용 예시 지점, report = 현장 제보 후 관리자 승인 지점 */
  origin?: "example" | "report";
  reported_at?: string | null;
  hidden?: boolean;
}

/** 현장 제보 (관리자 승인 대기) */
export interface ZoneReport {
  id: string;
  created_at: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  road_type: RoadType;
  climates: Weather[];
  risk: number;
  description: string;
  hazards: string[];
  prevention: string[];
  military_note: string | null;
  reporter: string | null;
  status: "pending" | "approved" | "rejected";
}

export interface Tip {
  id: string;
  group: "weather" | "road" | "military";
  key: string; // Weather | RoadType | military 키
  title: string;
  summary: string;
  steps: string[];
  caution: string | null;
}

/** 도로교통공단(TAAS) 공개 API 의 사고다발지역 1건 */
export type TaasKind = "all" | "freezing";

export interface TaasGeometry {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown;
}

export interface TaasZone {
  id: string;
  kind: TaasKind;
  year: number;
  name: string; // spot_nm
  region: string; // sido_sgg_nm
  lat: number;
  lng: number;
  occurrences: number;
  casualties: number;
  deaths: number;
  serious: number;
  minor: number;
  reported: number;
  geometry: TaasGeometry | null;
}

export interface TaasResponse {
  configured: boolean;
  year?: number;
  zones: TaasZone[];
  message?: string;
}

export const TAAS_KIND_LABEL: Record<TaasKind, string> = {
  all: "지자체별 사고다발지역",
  freezing: "결빙 사고다발지역",
};

export const WEATHER_LABEL: Record<Weather, string> = {
  rain: "비·폭우",
  snow: "눈",
  ice: "결빙·블랙아이스",
  fog: "안개",
  night: "야간",
  clear: "맑음",
  unknown: "조건 미확인",
};

export const ROAD_LABEL: Record<RoadType, string> = {
  highway: "고속도로",
  tunnel: "터널",
  curve: "급커브",
  mountain: "산악·굽은 도로",
  slope: "내리막·언덕",
  bridge: "교량·해안",
  underpass: "지하차도",
  urban: "도심·교차로",
  general: "일반도로",
};

export const RISK_COLOR: Record<number, string> = {
  1: "#2e9e4f",
  2: "#8bc34a",
  3: "#fbc02d",
  4: "#fb8c00",
  5: "#e53935",
};

export const RISK_LABEL: Record<number, string> = {
  1: "낮음",
  2: "다소 낮음",
  3: "보통",
  4: "높음",
  5: "매우 높음",
};
