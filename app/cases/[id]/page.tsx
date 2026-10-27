import Link from "next/link";
import { notFound } from "next/navigation";
import { getCases, getZones } from "@/lib/data";
import { ROAD_LABEL, WEATHER_LABEL } from "@/lib/types";

export const revalidate = 300;

export default async function CaseDetail({ params }: { params: { id: string } }) {
  const [cases, zones] = await Promise.all([getCases(), getZones()]);
  const c = cases.find((x) => x.id === params.id);
  if (!c) notFound();
  const relatedZones = zones.filter((z) => z.case_ids.includes(c.id));

  return (
    <div className="page">
      <Link href="/cases" className="back">← 사례 목록</Link>
      <div className="article">
        <div>
          <span className="badge">{WEATHER_LABEL[c.weather]}</span>
          <span className="badge">{ROAD_LABEL[c.road_type]}</span>
        </div>
        <h1 style={{ fontSize: 22, margin: "6px 0 2px" }}>{c.title}</h1>
        <div style={{ fontSize: 12, color: "#6b7785" }}>
          {c.program}
          {c.date ? ` · ${c.date}` : ""}
        </div>

        <h2>사건 요약</h2>
        <p>{c.summary}</p>
        <h2>원인</h2>
        <p>{c.cause ?? "소개글에 언급 없음"}</p>
        <h2>방송에서 언급된 조언</h2>
        <p>{c.advice ?? "소개글·기사에 언급 없음"}</p>
        <h2>교육 포인트</h2>
        <p className="lesson">{c.lesson}</p>

        {relatedZones.length > 0 && (
          <>
            <h2>관련 위험구역 (지도)</h2>
            {relatedZones.map((z) => (
              <div key={z.id} style={{ fontSize: 14, padding: "4px 0" }}>
                ▸ <Link className="back" href={`/?z=${z.id}`}>{z.name}</Link> ({z.region}) — 지도에서 보기
              </div>
            ))}
          </>
        )}

        <div className="src">
          출처: <a href={c.source_url} target="_blank" rel="noreferrer">{c.source_title}</a>
          <br />
          위 요약은 출처 기사·소개글을 바탕으로 하며, 교육 포인트는 본 사이트가 작성한 일반 안전운행 지침입니다.
        </div>
      </div>
    </div>
  );
}
