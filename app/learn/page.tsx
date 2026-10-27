import Link from "next/link";
import { getTips } from "@/lib/data";
import type { Tip } from "@/lib/types";

export const revalidate = 300;

const GROUPS: { id: Tip["group"]; title: string }[] = [
  { id: "weather", title: "기후별 안전운행" },
  { id: "road", title: "도로 유형별 안전운행" },
  { id: "military", title: "군 차량 특화 수칙" },
];

export default async function Learn() {
  const tips = await getTips();
  return (
    <div className="page">
      <h1>상황별 안전운행 교육</h1>
      <p className="lead">기후·도로 상황별 핵심 수칙입니다. 카드의 &quot;관련 사례 보기&quot;로 방송 사례와 함께 학습하세요.</p>

      <div className="anchors">
        {tips.map((t) => (
          <a key={t.id} href={`#${t.key}`}>
            {t.title.replace(" 안전운행", "")}
          </a>
        ))}
      </div>

      {GROUPS.map((g) => (
        <section key={g.id}>
          <h2 className="group-title">{g.title}</h2>
          <div className="cards">
            {tips
              .filter((t) => t.group === g.id)
              .map((t) => (
                <article className="card" id={t.key} key={t.id}>
                  <h3>{t.title}</h3>
                  <p>{t.summary}</p>
                  <ol>
                    {t.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                  {t.caution && <div className="caution">⚠ {t.caution}</div>}
                  {t.group !== "military" && (
                    <Link
                      className="more"
                      href={`/cases?${t.group === "weather" ? "weather" : "road"}=${t.key}`}
                    >
                      관련 사례 보기 →
                    </Link>
                  )}
                </article>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
