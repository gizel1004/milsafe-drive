"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { RISK_LABEL, ROAD_LABEL, WEATHER_LABEL, type Zone, type ZoneReport } from "@/lib/types";

const AdminMap = dynamic(() => import("@/components/AdminMap"), { ssr: false, loading: () => <div style={{ padding: 16 }}>지도 불러오는 중…</div> });

const KEY = "milsafe-admin-code";
const readCode = () => {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
};
const saveCode = (c: string) => {
  try {
    if (c) sessionStorage.setItem(KEY, c);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* 저장 불가 환경 */
  }
};

export default function AdminPage() {
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reports, setReports] = useState<ZoneReport[]>([]);
  const [reportZones, setReportZones] = useState<Zone[]>([]);
  const [focus, setFocus] = useState<string | null>(null);
  const [riskOverride, setRiskOverride] = useState<Record<string, number>>({});

  const sb = getSupabase();

  const refresh = useCallback(
    async (c: string) => {
      if (!sb) return;
      const [r, z] = await Promise.all([
        sb.rpc("admin_list_reports", { p_code: c }),
        sb.from("zones").select("*").eq("origin", "report").order("reported_at", { ascending: false }),
      ]);
      if (r.error) {
        setMsg("관리자 코드가 올바르지 않거나 서버에 연결할 수 없습니다.");
        setAuthed(false);
        saveCode("");
        return;
      }
      setReports((r.data ?? []) as ZoneReport[]);
      setReportZones((z.data ?? []) as Zone[]);
    },
    [sb],
  );

  useEffect(() => {
    const c = readCode();
    if (c) {
      setCode(c);
      setAuthed(true);
      refresh(c);
    }
  }, [refresh]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (!sb || !input.trim()) return;
    setBusy(true);
    setMsg(null);
    const { data, error } = await sb.rpc("admin_check", { p_code: input.trim() });
    setBusy(false);
    if (error || data !== true) {
      setMsg("관리자 코드가 올바르지 않습니다.");
      return;
    }
    const c = input.trim();
    setCode(c);
    setAuthed(true);
    setInput("");
    saveCode(c);
    refresh(c);
  }

  async function revalidate() {
    try {
      await fetch("/api/revalidate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    } catch {
      /* 실패해도 1분 안에 자동 반영 */
    }
  }

  async function approve(r: ZoneReport) {
    if (!sb) return;
    setBusy(true);
    const { data, error } = await sb.rpc("admin_approve_report", { p_code: code, p_id: r.id, p_risk: riskOverride[r.id] ?? null });
    setBusy(false);
    if (error) return setMsg(`승인 실패: ${error.message}`);
    await revalidate();
    setMsg(`'${r.name}' 승인 완료 — 지도에 표시됩니다. (지점 ID ${data})`);
    refresh(code);
  }

  async function reject(r: ZoneReport) {
    if (!sb) return;
    if (!window.confirm(`'${r.name}' 제보를 반려할까요?`)) return;
    setBusy(true);
    const { error } = await sb.rpc("admin_reject_report", { p_code: code, p_id: r.id });
    setBusy(false);
    if (error) return setMsg(`반려 실패: ${error.message}`);
    setMsg(`'${r.name}' 제보를 반려했습니다.`);
    refresh(code);
  }

  async function setHidden(z: Zone, hidden: boolean) {
    if (!sb) return;
    setBusy(true);
    const { error } = await sb.rpc("admin_set_zone_hidden", { p_code: code, p_zone_id: z.id, p_hidden: hidden });
    setBusy(false);
    if (error) return setMsg(`변경 실패: ${error.message}`);
    await revalidate();
    setMsg(hidden ? `'${z.name}'을(를) 지도에서 숨겼습니다.` : `'${z.name}'을(를) 다시 표시합니다.`);
    refresh(code);
  }

  function logout() {
    saveCode("");
    setCode("");
    setAuthed(false);
    setReports([]);
    setReportZones([]);
  }

  if (!authed) {
    return (
      <div className="page admin">
        <h1>위험지역 제보 관리</h1>
        <p className="lead">관리자 코드를 입력하면 장병들이 보낸 제보를 확인하고 승인할 수 있습니다.</p>
        <form className="search" onSubmit={login}>
          <input type="password" value={input} onChange={(e) => setInput(e.target.value)} placeholder="관리자 코드" aria-label="관리자 코드" autoComplete="current-password" />
          <button type="submit" className="btn" disabled={busy}>
            {busy ? "확인 중…" : "들어가기"}
          </button>
        </form>
        {msg && <div className="report-error">{msg}</div>}
        <p style={{ marginTop: 24 }}>
          <Link href="/" className="back">← 위험지도로</Link>
        </p>
      </div>
    );
  }

  const pts = reports.map((r) => ({ id: r.id, name: r.name, lat: r.lat, lng: r.lng, risk: riskOverride[r.id] ?? r.risk }));

  return (
    <div className="page admin">
      <div className="admin-top">
        <h1>위험지역 제보 관리</h1>
        <button type="button" className="reset" onClick={logout}>
          나가기
        </button>
      </div>
      <p className="lead">
        승인 대기 {reports.length}건 · 제보로 추가된 지점 {reportZones.length}곳. 승인하면 바로 지도에 점선 테두리 지점으로 표시됩니다.
      </p>
      {msg && <div className="taas-msg" style={{ marginBottom: 12 }}>{msg}</div>}

      {reports.length > 0 && (
        <div className="admin-map">
          <AdminMap pts={pts} focus={focus} onSelect={setFocus} />
        </div>
      )}

      <h2 className="group-title">승인 대기 제보</h2>
      {reports.length === 0 && <p className="lead">대기 중인 제보가 없습니다.</p>}
      <div className="cards">
        {reports.map((r) => (
          <article key={r.id} className={`card admin-card ${focus === r.id ? "focus" : ""}`} onClick={() => setFocus(r.id)}>
            <h3>{r.name}</h3>
            <p>
              {r.region} · {ROAD_LABEL[r.road_type]} · {r.climates.map((c) => WEATHER_LABEL[c]).join("/") || "기상 조건 없음"}
              <br />
              {r.lat.toFixed(4)}, {r.lng.toFixed(4)} · {r.created_at.slice(0, 16).replace("T", " ")} 접수{r.reporter ? ` · ${r.reporter}` : ""}
            </p>
            <div className="admin-desc">{r.description}</div>
            {r.hazards.length > 0 && <div className="admin-sub">위험 요인: {r.hazards.join(", ")}</div>}
            {r.prevention.length > 0 && <div className="admin-sub">예방 수칙: {r.prevention.join(", ")}</div>}
            {r.military_note && <div className="admin-sub">군 차량: {r.military_note}</div>}
            <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
              <label>
                위험도{" "}
                <select value={riskOverride[r.id] ?? r.risk} onChange={(e) => setRiskOverride({ ...riskOverride, [r.id]: Number(e.target.value) })} onClick={(e) => e.stopPropagation()}>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} · {RISK_LABEL[n]}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="btn" disabled={busy} onClick={(e) => { e.stopPropagation(); approve(r); }}>
                승인
              </button>
              <button type="button" className="btn ghost" disabled={busy} onClick={(e) => { e.stopPropagation(); reject(r); }}>
                반려
              </button>
            </div>
          </article>
        ))}
      </div>

      <h2 className="group-title">제보로 추가된 지점</h2>
      {reportZones.length === 0 && <p className="lead">아직 없습니다.</p>}
      <div className="cards">
        {reportZones.map((z) => (
          <article key={z.id} className="card admin-card">
            <h3>
              {z.name} {z.hidden && <span className="badge">숨김</span>}
            </h3>
            <p>
              {z.region} · {ROAD_LABEL[z.road_type]} · 위험도 {z.risk}
            </p>
            <div className="row">
              <Link className="back" href={`/?z=${z.id}`}>지도에서 보기</Link>
              <button type="button" className="btn ghost" disabled={busy} onClick={() => setHidden(z, !z.hidden)}>
                {z.hidden ? "다시 표시" : "지도에서 숨기기"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
