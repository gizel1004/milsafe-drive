import Link from "next/link";
import { getCases } from "@/lib/data";
import { ROAD_LABEL, WEATHER_LABEL, type RoadType, type Weather } from "@/lib/types";

export const revalidate = 300;

export default async function Cases({ searchParams }: { searchParams: { weather?: string; road?: string } }) {
  const all = await getCases();
  const { weather, road } = searchParams;
  const list = all.filter((c) => (!weather || c.weather === weather) && (!road || c.road_type === road));

  const href = (w?: string, r?: string) => {
    const p = new URLSearchParams();
    if (w) p.set("weather", w);
    if (r) p.set("road", r);
    const q = p.toString();
    return q ? `/cases?${q}` : "/cases";
  };

  const weathers = (Object.keys(WEATHER_LABEL) as Weather[]).filter((w) => w !== "clear");
  const roads = Object.keys(ROAD_LABEL) as RoadType[];

  return (
    <div className="page">
      <h1>사고 사례</h1>
      <p className="lead">한블리 등 방송 기사·프로그램 소개글에서 확인된 사례 {all.length}건의 요약입니다. 총 {list.length}건 표시 중.</p>

      <div className="filters">
        <div className="label">기후</div>
        <Link href={href(undefined, road)} className={!weather ? "on" : ""}>전체</Link>
        {weathers.map((w) => (
          <Link key={w} href={href(w, road)} className={weather === w ? "on" : ""}>
            {WEATHER_LABEL[w]}
          </Link>
        ))}
        <div className="label">도로</div>
        <Link href={href(weather, undefined)} className={!road ? "on" : ""}>전체</Link>
        {roads.map((r) => (
          <Link key={r} href={href(weather, r)} className={road === r ? "on" : ""}>
            {ROAD_LABEL[r]}
          </Link>
        ))}
      </div>

      <div className="cards">
        {list.map((c) => (
          <Link key={c.id} href={`/cases/${c.id}`} className="card case-card">
            <div>
              <span className="badge">{WEATHER_LABEL[c.weather]}</span>
              <span className="badge">{ROAD_LABEL[c.road_type]}</span>
            </div>
            <div className="t">{c.title}</div>
            <div className="s">
              {c.program}
              {c.date ? ` · ${c.date}` : ""}
            </div>
          </Link>
        ))}
        {list.length === 0 && <p>조건에 맞는 사례가 없습니다.</p>}
      </div>
    </div>
  );
}
