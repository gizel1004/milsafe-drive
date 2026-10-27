// data/*.json -> supabase/seed.sql 생성: npm run seed:sql
import { readFileSync, writeFileSync } from "node:fs";

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url), "utf8"));
const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a) => `array[${a.map(q).join(", ")}]::text[]`;

const out = [];
out.push("-- 자동 생성: npm run seed:sql (schema.sql 실행 후 이 파일을 실행)");
out.push("truncate public.cases, public.zones, public.tips;");

for (const c of load("cases")) {
  out.push(
    `insert into public.cases (id,title,program,date,source_title,source_url,weather,road_type,summary,cause,advice,lesson) values (${[
      c.id, c.title, c.program, c.date, c.source_title, c.source_url, c.weather, c.road_type, c.summary, c.cause, c.advice, c.lesson,
    ].map(q).join(", ")});`,
  );
}
for (const z of load("zones")) {
  out.push(
    `insert into public.zones (id,name,region,lat,lng,road_type,climates,risk,description,hazards,prevention,military_note,case_ids) values (${q(z.id)}, ${q(z.name)}, ${q(z.region)}, ${z.lat}, ${z.lng}, ${q(z.road_type)}, ${arr(z.climates)}, ${z.risk}, ${q(z.description)}, ${arr(z.hazards)}, ${arr(z.prevention)}, ${q(z.military_note)}, ${arr(z.case_ids)});`,
  );
}
for (const t of load("tips")) {
  out.push(
    `insert into public.tips (id,"group",key,title,summary,steps,caution) values (${q(t.id)}, ${q(t.group)}, ${q(t.key)}, ${q(t.title)}, ${q(t.summary)}, ${arr(t.steps)}, ${q(t.caution)});`,
  );
}

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), out.join("\n") + "\n");
console.log("supabase/seed.sql 생성 완료");
