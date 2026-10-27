import Link from "next/link";
import { getCases } from "@/lib/data";
import { ROAD_LABEL, WEATHER_LABEL, type RoadType, type Weather } from "@/lib/types";

export const revalidate = 300;

export default async function Cases({ searchParams }: { searchParams: { weather?: string; road?: string; q?: string } }) {
  const all = await getCases();
  const { weather, road } = searchParams;
  const q = (searchParams.q ?? "").trim();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const list = all.filter((c) => {
    if (weather && c.weather !== weather) return false;
    if (road && c.road_type !== road) return false;
    if (!words.length) return true;
    const text = [c.title, c.summary, c.cause, c.advice, c.lesson, c.program].join(" ").toLowerCase();
    return words.every((w) => text.includes(w));
  });

  const href = (w?: string, r?: string) => {
    const p = new URLSearchParams();
    if (w) p.set("weather", w);
    if (r) p.set("road", r);
    if (q) p.set("q", q);
    const s = p.toString();
    return s ? `/cases?${s}` : "/cases";
  };

  const weathers = (Object.keys(WEATHER_LABEL) as Weather[]).filter((w) => w !== "clear");
  const roads = Object.keys(ROAD_LABEL) as RoadType[];
  const countW = (w: string) => all.filter((c) => c.weather === w && (!road || c.road_type === road)).length;
  const countR = (r: string) => all.filter((c) => c.road_type === r && (!weather || c.weather === weather)).length;

  return (
    <div className="page">
      <h1>사고 사례</h1>
      <p className="lead">
        한블리 등 방송 기사·프로그램 소개글에서 확인된 사례 {all.length}건의 요약입니다. 현재 {list.length}건 표시 중.
      </p>

      <form className="search" action="/cases" method="get" role="search">
        {weather && <input type="hidden" name="weather" value={weather} />}
        {road && <input type="hidden" name="road" value={road} />}
        <input type="search" name="q" defaultValue={q} placeholder="사례 검색 (예: 블랙아이스, 제설차, 터널)" aria-label="사례 검색" />
        <button type="submit" className="btn">검색</button>
        {q && (
          <Link
            href={(() => {
              const p = new URLSearchParams();
              if (weather) p.set("weather", weather);
              if (road) p.set("road", road);
              const s = p.toString();
              return s ? `/cases?${s}` : "/cases";
            })()}
            className="reset"
          >
            검색어 지우기
          </Link>
        )}
      </form>

      <div className="filters">
        <div className="label">기후</div>
        <Link href={href(undefined, road)} className={!weather ? "on" : ""}>전체</Link>
        {weathers.map((w) => (
          <Link key={w} href={href(w, road)} className={weather === w ? "on" : ""}>
            {WEATHER_LABEL[w]} <span className="cnt">{countW(w)}</span>
          </Link>
        ))}
        <div className="label">도로</div>
        <Link href={href(weather, undefined)} className={!road ? "on" : ""}>전체</Link>
        {roads.map((r) => (
          <Link key={r} href={href(weather, r)} className={road === r ? "on" : ""}>
            {ROAD_LABEL[r]} <span className="cnt">{countR(r)}</span>
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
        {list.length === 0 && (
          <p>
            조건에 맞는 사례가 없습니다. <Link href="/cases">전체 사례 보기</Link>
          </p>
        )}
      </div>
    </div>
  );
}
