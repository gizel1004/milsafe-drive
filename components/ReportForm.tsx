"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { RISK_LABEL, ROAD_LABEL, WEATHER_LABEL, type RoadType, type Weather } from "@/lib/types";

const WEATHERS: Weather[] = ["rain", "snow", "ice", "fog", "night"];
const ROADS: RoadType[] = ["highway", "tunnel", "curve", "mountain", "slope", "bridge", "underpass", "urban", "general"];

const lines = (s: string) =>
  s
    .split(/\n|,/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 8);

export default function ReportForm({
  pick,
  onPickRequest,
  onClose,
}: {
  pick: { lat: number; lng: number } | null;
  onPickRequest: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [road, setRoad] = useState<RoadType>("mountain");
  const [climates, setClimates] = useState<Weather[]>([]);
  const [risk, setRisk] = useState(3);
  const [description, setDescription] = useState("");
  const [hazards, setHazards] = useState("");
  const [prevention, setPrevention] = useState("");
  const [note, setNote] = useState("");
  const [reporter, setReporter] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const problems = [
    !pick && "지도에서 위치를 선택하세요.",
    name.trim().length < 2 && "지점 이름을 2자 이상 입력하세요.",
    region.trim().length < 2 && "지역(시군)을 입력하세요.",
    description.trim().length < 5 && "위험 내용을 5자 이상 적어 주세요.",
  ].filter(Boolean) as string[];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (problems.length) {
      setError(problems[0]);
      return;
    }
    const sb = getSupabase();
    if (!sb || !pick) return;
    setSending(true);
    setError(null);
    const { error } = await sb.from("zone_reports").insert({
      name: name.trim(),
      region: region.trim(),
      lat: pick.lat,
      lng: pick.lng,
      road_type: road,
      climates,
      risk,
      description: description.trim(),
      hazards: lines(hazards),
      prevention: lines(prevention),
      military_note: note.trim() || null,
      reporter: reporter.trim() || null,
    });
    setSending(false);
    if (error) {
      setError(error.message.includes("잠시 후") ? error.message : "제보를 보내지 못했습니다. 입력값을 확인하고 다시 시도하세요.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="report-box">
        <h3>제보가 접수되었습니다</h3>
        <p className="report-help">관리자가 확인·승인하면 지도에 점선 테두리 지점으로 표시됩니다. 감사합니다.</p>
        <button type="button" className="btn" onClick={onClose}>
          닫기
        </button>
      </div>
    );
  }

  return (
    <form className="report-box" onSubmit={submit}>
      <div className="report-head">
        <h3>새 위험지역 제보</h3>
        <button type="button" className="close" onClick={onClose} aria-label="제보 닫기">
          ×
        </button>
      </div>
      <p className="report-help">관리자 승인 후 지도에 표시됩니다. 개인정보나 부대 보안사항은 적지 마세요.</p>

      <div className="field">
        <span className="flabel">1. 위치</span>
        {pick ? (
          <div className="pick-ok">
            ✓ 선택됨 ({pick.lat.toFixed(4)}, {pick.lng.toFixed(4)}){" "}
            <button type="button" className="reset" onClick={onPickRequest}>
              다시 선택
            </button>
          </div>
        ) : (
          <button type="button" className="btn ghost" onClick={onPickRequest}>
            지도에서 위치 누르기
          </button>
        )}
      </div>

      <label className="field">
        <span className="flabel">2. 지점 이름</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="예: ○○고개 내리막 급커브" />
      </label>
      <label className="field">
        <span className="flabel">3. 지역</span>
        <input value={region} onChange={(e) => setRegion(e.target.value)} maxLength={60} placeholder="예: 강원 홍천" />
      </label>
      <label className="field">
        <span className="flabel">4. 도로 유형</span>
        <select value={road} onChange={(e) => setRoad(e.target.value as RoadType)}>
          {ROADS.map((r) => (
            <option key={r} value={r}>
              {ROAD_LABEL[r]}
            </option>
          ))}
        </select>
      </label>
      <div className="field">
        <span className="flabel">5. 위험한 기상 조건 (여러 개 선택)</span>
        <div className="chips">
          {WEATHERS.map((w) => (
            <button
              type="button"
              key={w}
              aria-pressed={climates.includes(w)}
              className={`chip ${climates.includes(w) ? "on" : ""}`}
              onClick={() => setClimates(climates.includes(w) ? climates.filter((x) => x !== w) : [...climates, w])}
            >
              {WEATHER_LABEL[w]}
            </button>
          ))}
        </div>
      </div>
      <label className="field">
        <span className="flabel">6. 위험도</span>
        <select value={risk} onChange={(e) => setRisk(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} · {RISK_LABEL[n]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="flabel">7. 무엇이 위험한가요?</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} placeholder="예: 그늘진 내리막 커브라 겨울 새벽마다 결빙. 대형차 미끄러짐 목격." />
      </label>
      <label className="field">
        <span className="flabel">위험 요인 (선택, 줄마다 하나)</span>
        <textarea value={hazards} onChange={(e) => setHazards(e.target.value)} rows={2} placeholder={"블랙아이스\n시야가 막힌 커브"} />
      </label>
      <label className="field">
        <span className="flabel">예방 수칙 (선택, 줄마다 하나)</span>
        <textarea value={prevention} onChange={(e) => setPrevention(e.target.value)} rows={2} placeholder={"커브 진입 전 감속\n차간거리 2배"} />
      </label>
      <label className="field">
        <span className="flabel">군 차량 유의사항 (선택)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="예: 5톤 트럭은 저단 기어 유지" />
      </label>
      <label className="field">
        <span className="flabel">제보자 (선택, 부대·직책 정도)</span>
        <input value={reporter} onChange={(e) => setReporter(e.target.value)} maxLength={40} placeholder="예: 수송대 간부" />
      </label>

      {error && <div className="report-error">{error}</div>}
      <button type="submit" className="btn" disabled={sending}>
        {sending ? "보내는 중…" : "제보 보내기"}
      </button>
    </form>
  );
}
