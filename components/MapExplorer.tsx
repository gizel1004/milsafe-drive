"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import sigungu from "@/data/sigungu.json";
import {
  RISK_COLOR,
  RISK_LABEL,
  ROAD_LABEL,
  TAAS_KIND_LABEL,
  WEATHER_LABEL,
  type CaseItem,
  type RoadType,
  type TaasKind,
  type TaasResponse,
  type TaasZone,
  type Weather,
  type Zone,
} from "@/lib/types";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div style={{ padding: 20 }}>지도를 불러오는 중…</div>,
});

const TAAS_COLOR: Record<TaasKind, string> = { all: "#8e24aa", freezing: "#1e88e5" };
const WEATHERS: Weather[] = ["rain", "snow", "ice", "fog", "night"];
const ROADS: RoadType[] = ["highway", "tunnel", "curve", "mountain", "slope", "bridge", "underpass", "urban", "general"];

type Region = { sido: string; siDo: string; guguns: { code: string; name: string }[] };
const REGIONS = sigungu as Region[];

/** 전방지역 일괄 조회 대상 (시도코드, 시군구코드) */
const FRONTLINE: { name: string; siDo: string; guGun: string }[] = [
  { name: "철원군", siDo: "42", guGun: "780" },
  { name: "화천군", siDo: "42", guGun: "790" },
  { name: "양구군", siDo: "42", guGun: "800" },
  { name: "인제군", siDo: "42", guGun: "810" },
  { name: "고성군(강원)", siDo: "42", guGun: "820" },
  { name: "연천군", siDo: "41", guGun: "800" },
  { name: "파주시", siDo: "41", guGun: "480" },
  { name: "포천시", siDo: "41", guGun: "650" },
  { name: "양주시", siDo: "41", guGun: "630" },
];

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

async function callTaas(kind: TaasKind, siDo: string, guGun: string, year: string): Promise<TaasResponse> {
  const q = new URLSearchParams({ kind, siDo, guGun });
  if (year) q.set("year", year);
  const res = await fetch(`/api/taas?${q.toString()}`);
  return (await res.json()) as TaasResponse;
}

export default function MapExplorer({ zones, cases }: { zones: Zone[]; cases: CaseItem[] }) {
  // 교육용 예시 지점 필터
  const [weathers, setWeathers] = useState<Weather[]>([]);
  const [roads, setRoads] = useState<RoadType[]>([]);
  const [minRisk, setMinRisk] = useState(1);
  const [showExamples, setShowExamples] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // TAAS 실데이터
  const [sidoIdx, setSidoIdx] = useState(0);
  const [gugun, setGugun] = useState("");
  const [kind, setKind] = useState<TaasKind>("freezing");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [taasZones, setTaasZones] = useState<TaasZone[]>([]);
  const [taasMsg, setTaasMsg] = useState<string | null>(null);
  const [selectedTaasId, setSelectedTaasId] = useState<string | null>(null);

  const region = REGIONS[sidoIdx];

  // 모바일: 범례는 접힌 상태로 시작, 지점 선택 시 상세 패널로 스크롤
  const [legendOpen, setLegendOpen] = useState(true);
  useEffect(() => {
    if (window.matchMedia("(max-width: 800px)").matches) setLegendOpen(false);
  }, []);
  useEffect(() => {
    if (!selectedId && !selectedTaasId) return;
    if (!window.matchMedia("(max-width: 800px)").matches) return;
    const t = setTimeout(() => document.querySelector(".detail")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    return () => clearTimeout(t);
  }, [selectedId, selectedTaasId]);

  const filtered = useMemo(
    () =>
      zones.filter(
        (z) =>
          z.risk >= minRisk &&
          (weathers.length === 0 || z.climates.some((c) => weathers.includes(c))) &&
          (roads.length === 0 || roads.includes(z.road_type)),
      ),
    [zones, weathers, roads, minRisk],
  );
  const visibleExamples = showExamples ? filtered : [];

  const selected = zones.find((z) => z.id === selectedId) ?? null;
  const selectedTaas = taasZones.find((z) => z.id === selectedTaasId) ?? null;
  const related = selected ? cases.filter((c) => selected.case_ids.includes(c.id)) : [];

  const selectExample = (id: string) => {
    setSelectedTaasId(null);
    setSelectedId(id);
  };
  const selectTaas = (id: string) => {
    setSelectedId(null);
    setSelectedTaasId(id);
  };
  const resetFilters = () => {
    setWeathers([]);
    setRoads([]);
    setMinRisk(1);
  };

  async function loadRegion() {
    if (!gugun) {
      setTaasMsg("시군구를 선택하세요.");
      return;
    }
    setLoading(true);
    setTaasMsg(null);
    setSelectedTaasId(null);
    try {
      const r = await callTaas(kind, region.siDo, gugun, year);
      setTaasZones(r.zones);
      setTaasMsg(r.message ?? (r.year ? `${r.year}년 자료 ${r.zones.length}건` : null));
    } catch {
      setTaasMsg("조회 중 네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function loadFrontline() {
    setLoading(true);
    setTaasMsg(null);
    setSelectedTaasId(null);
    const all: TaasZone[] = [];
    let failed = 0;
    let notConfigured = false;
    for (const f of FRONTLINE) {
      try {
        const r = await callTaas(kind, f.siDo, f.guGun, year);
        if (!r.configured) {
          notConfigured = true;
          setTaasMsg(r.message ?? null);
          break;
        }
        all.push(...r.zones);
        if (r.message && r.zones.length === 0 && /오류|환경변수|올바르지/.test(r.message)) failed++;
      } catch {
        failed++;
      }
    }
    if (!notConfigured) {
      setTaasZones(all);
      setTaasMsg(`전방지역 ${FRONTLINE.length}개 시군 중 ${all.length}개소 표시${failed ? ` (${failed}곳 조회 실패)` : ""}`);
    }
    setLoading(false);
  }

  return (
    <div className="explorer">
      <aside className="side">
        <div className="side-head">위험구역 분석</div>

        {selected && (
          <div className="detail">
            <button className="close" onClick={() => setSelectedId(null)} aria-label="닫기">
              ×
            </button>
            <h2>{selected.name}</h2>
            <div className="meta">{selected.region} · 교육용 예시 지점</div>
            <span className="badge risk" style={{ background: RISK_COLOR[selected.risk] }}>
              위험도 {selected.risk} · {RISK_LABEL[selected.risk]}
            </span>
            <span className="badge">{ROAD_LABEL[selected.road_type]}</span>
            {selected.climates.map((c) => (
              <span className="badge" key={c}>
                {WEATHER_LABEL[c]}
              </span>
            ))}
            <p style={{ fontSize: 13, margin: "8px 0 0" }}>{selected.description}</p>
            <h4>주요 위험 요인</h4>
            <ul>
              {selected.hazards.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            <h4>예방 수칙</h4>
            <ul>
              {selected.prevention.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            <div className="mil">
              <b>군 차량 유의사항</b>
              <br />
              {selected.military_note}
            </div>
            {related.length > 0 && (
              <>
                <h4>관련 방송 사례</h4>
                {related.map((c) => (
                  <Link key={c.id} href={`/cases/${c.id}`} className="case-link">
                    ▸ {c.title}
                  </Link>
                ))}
              </>
            )}
            <Link href={`/learn#${selected.climates[0] ?? "rain"}`} className="case-link" style={{ borderBottom: "none" }}>
              → 관련 상황별 교육 보기
            </Link>
          </div>
        )}

        {selectedTaas && (
          <div className="detail" style={{ background: "#f6f3fb", borderBottomColor: TAAS_COLOR[selectedTaas.kind] }}>
            <button className="close" onClick={() => setSelectedTaasId(null)} aria-label="닫기">
              ×
            </button>
            <h2>{selectedTaas.name}</h2>
            <div className="meta">{selectedTaas.region} · 도로교통공단 TAAS 실데이터</div>
            <span className="badge risk" style={{ background: TAAS_COLOR[selectedTaas.kind] }}>
              {TAAS_KIND_LABEL[selectedTaas.kind]}
            </span>
            <span className="badge">{selectedTaas.year}년</span>
            <table className="stat">
              <tbody>
                <tr><th>사고 발생</th><td>{selectedTaas.occurrences}건</td></tr>
                <tr><th>사상자</th><td>{selectedTaas.casualties}명</td></tr>
                <tr><th>사망</th><td>{selectedTaas.deaths}명</td></tr>
                <tr><th>중상</th><td>{selectedTaas.serious}명</td></tr>
                <tr><th>경상</th><td>{selectedTaas.minor}명</td></tr>
                <tr><th>부상신고</th><td>{selectedTaas.reported}명</td></tr>
              </tbody>
            </table>
            <div className="mil">
              <b>군 차량 유의사항</b>
              <br />
              {selectedTaas.kind === "freezing"
                ? "겨울철 새벽·야간에 이 지점을 통과할 때는 결빙을 먼저 의심하고 속도를 절반 수준으로 낮추며 차간 거리를 늘린다. 출발 시각 조정도 검토한다."
                : "수송 경로에 포함되면 사전에 지휘관과 공유하고, 해당 구간에서는 감속·차간 거리 확대·유도원 배치를 검토한다."}
            </div>
            <Link
              href={selectedTaas.kind === "freezing" ? "/learn#ice" : "/learn"}
              className="case-link"
              style={{ borderBottom: "none" }}
            >
              → 관련 상황별 교육 보기
            </Link>
            <div style={{ fontSize: 11, color: "#6b7785", marginTop: 6 }}>
              출처: 한국도로교통공단(TAAS) 사고다발지역 공개 데이터, 공공데이터포털
            </div>
          </div>
        )}

        {/* ── TAAS 실데이터 ── */}
        <div className="section taas-box">
          <h3>실제 사고다발지역 (도로교통공단 TAAS)</h3>
          <div className="row" style={{ marginBottom: 6 }}>
            <select
              aria-label="시도"
              value={sidoIdx}
              onChange={(e) => {
                setSidoIdx(Number(e.target.value));
                setGugun("");
              }}
            >
              {REGIONS.map((r, i) => (
                <option key={r.siDo} value={i}>
                  {r.sido}
                </option>
              ))}
            </select>
            <select aria-label="시군구" value={gugun} onChange={(e) => setGugun(e.target.value)}>
              <option value="">시군구 선택</option>
              {region.guguns.map((g) => (
                <option key={g.code} value={g.code}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="row" style={{ marginBottom: 6 }}>
            <select aria-label="종류" value={kind} onChange={(e) => setKind(e.target.value as TaasKind)}>
              <option value="freezing">{TAAS_KIND_LABEL.freezing}</option>
              <option value="all">{TAAS_KIND_LABEL.all}</option>
            </select>
            <select aria-label="연도" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">최신 자동</option>
              {[2025, 2024, 2023, 2022, 2021, 2020].map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
          </div>
          <div className="row">
            <button className="btn" onClick={loadRegion} disabled={loading}>
              {loading ? "조회 중…" : "조회"}
            </button>
            <button className="btn ghost" onClick={loadFrontline} disabled={loading}>
              전방지역 일괄
            </button>
            {taasZones.length > 0 && (
              <button
                className="reset"
                onClick={() => {
                  setTaasZones([]);
                  setTaasMsg(null);
                  setSelectedTaasId(null);
                }}
              >
                지우기
              </button>
            )}
          </div>
          {taasMsg && <div className="taas-msg">{taasMsg}</div>}
          {taasZones.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {taasZones.map((z) => (
                <div key={z.id} className={`zone-item ${z.id === selectedTaasId ? "sel" : ""}`} onClick={() => selectTaas(z.id)}>
                  <span className="dot" style={{ background: TAAS_COLOR[z.kind] }} />
                  <div>
                    <div className="nm">{z.name}</div>
                    <div className="sub">
                      {z.region} · {z.year}년 · 사고 {z.occurrences}건 · 사망 {z.deaths}명
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="sub" style={{ fontSize: 11, color: "#6b7785", marginTop: 6 }}>
            공표 기준에 따라 시군구당 일부 지점만 제공될 수 있습니다.
          </div>
        </div>

        {/* ── 교육용 예시 지점 ── */}
        <div className="section">
          <div className="row" style={{ marginBottom: 8 }}>
            <label>
              <input type="checkbox" checked={showExamples} onChange={(e) => setShowExamples(e.target.checked)} /> 교육용 예시 지점 표시
            </label>
          </div>
          <h3>기후 조건</h3>
          <div className="chips">
            {WEATHERS.map((w) => (
              <button key={w} className={`chip ${weathers.includes(w) ? "on" : ""}`} onClick={() => setWeathers(toggle(weathers, w))}>
                {WEATHER_LABEL[w]}
              </button>
            ))}
          </div>
        </div>
        <div className="section">
          <h3>도로 유형</h3>
          <div className="chips">
            {ROADS.map((r) => (
              <button key={r} className={`chip ${roads.includes(r) ? "on" : ""}`} onClick={() => setRoads(toggle(roads, r))}>
                {ROAD_LABEL[r]}
              </button>
            ))}
          </div>
        </div>
        <div className="section">
          <div className="row">
            <label htmlFor="risk">최소 위험도</label>
            <select id="risk" value={minRisk} onChange={(e) => setMinRisk(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} 이상
                </option>
              ))}
            </select>
            <button className="reset" onClick={resetFilters}>
              필터 초기화
            </button>
          </div>
        </div>

        <div className="result-head">
          <span>교육용 예시 지점</span>
          <span>총 {visibleExamples.length}건</span>
        </div>
        {visibleExamples.length === 0 && <div style={{ padding: 16, fontSize: 13, color: "#6b7785" }}>표시할 지점이 없습니다.</div>}
        {visibleExamples.map((z) => (
          <div key={z.id} className={`zone-item ${z.id === selectedId ? "sel" : ""}`} onClick={() => selectExample(z.id)}>
            <span className="dot" style={{ background: RISK_COLOR[z.risk] }} />
            <div>
              <div className="nm">{z.name}</div>
              <div className="sub">
                {z.region} · {ROAD_LABEL[z.road_type]} · {z.climates.map((c) => WEATHER_LABEL[c]).join("/")}
              </div>
            </div>
          </div>
        ))}
      </aside>

      <div className="map-wrap">
        <LeafletMap
          zones={visibleExamples}
          selectedId={selectedId}
          onSelect={selectExample}
          taasZones={taasZones}
          selectedTaasId={selectedTaasId}
          onSelectTaas={selectTaas}
        />
        <details className="legend" open={legendOpen} onToggle={(e) => setLegendOpen((e.target as HTMLDetailsElement).open)}>
          <summary>범례</summary>
          <div className="legend-body">
            <b>교육용 예시 위험도</b>
            {[5, 4, 3, 2, 1].map((n) => (
              <div key={n}>
                <i style={{ background: RISK_COLOR[n] }} />
                {n} · {RISK_LABEL[n]}
              </div>
            ))}
            <b>TAAS 실데이터</b>
            <div>
              <i style={{ background: TAAS_COLOR.freezing }} />
              결빙 사고다발
            </div>
            <div>
              <i style={{ background: TAAS_COLOR.all }} />
              지자체별 사고다발
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
