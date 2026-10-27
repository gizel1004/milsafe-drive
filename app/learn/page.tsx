import Link from "next/link";
import LearnCollapse from "@/components/LearnCollapse";
import { getCases, getTips } from "@/lib/data";
import type { Tip } from "@/lib/types";

export const revalidate = 300;

const GROUPS: { id: Tip["group"]; title: string }[] = [
  { id: "weather", title: "기후별 안전운행" },
  { id: "road", title: "도로 유형별 안전운행" },
  { id: "military", title: "군 차량 특화 수칙" },
];

const short = (t: string) => t.replace(/(과)? ?안전운행$/, "").trim();

export default async function Learn() {
  const [tips, cases] = await Promise.all([getTips(), getCases()]);
  const countFor = (t: Tip) =>
    t.group === "weather"
      ? cases.filter((c) => c.weather === t.key).length
      : t.group === "road"
        ? cases.filter((c) => c.road_type === t.key).length
        : 0;

  return (
    <div className="page">
      <h1>상황별 안전운행 교육</h1>
      <p className="lead">기후·도로 상황별 핵심 수칙입니다. 제목을 누르면 펼치거나 접을 수 있고, &quot;관련 사례 보기&quot;로 방송 사례와 함께 학습할 수 있습니다.</p>

      <nav className="anchors" aria-label="교육 주제 바로가기">
        {tips.map((t) => (
          <a key={t.id} href={`#${t.key}`}>
            {short(t.title)}
          </a>
        ))}
      </nav>

      {GROUPS.map((g) => (
        <section key={g.id}>
          <h2 className="group-title">{g.title}</h2>
          <div className="cards">
            {tips
              .filter((t) => t.group === g.id)
              .map((t) => {
                const n = countFor(t);
                return (
                  <details className="card learn-card" id={t.key} key={t.id} open>
                    <summary>
                      <h3>{t.title}</h3>
                      <p>{t.summary}</p>
                    </summary>
                    <ol>
                      {t.steps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                    {t.caution && <div className="caution">⚠ {t.caution}</div>}
                    {t.group !== "military" &&
                      (n > 0 ? (
                        <Link className="more" href={`/cases?${t.group === "weather" ? "weather" : "road"}=${t.key}`}>
                          관련 사례 보기 ({n}건) →
                        </Link>
                      ) : (
                        <span className="more muted">관련 방송 사례 수집 중</span>
                      ))}
                  </details>
                );
              })}
          </div>
        </section>
      ))}
      <LearnCollapse />
    </div>
  );
}
