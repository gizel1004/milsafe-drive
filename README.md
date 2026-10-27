# 군 차량 안전운행 교육 사이트

한블리 등 방송 사례를 기반으로 한 군 차량 사고예방·상황별 안전운행 교육 프로그램입니다.
Next.js 14 + Leaflet(OpenStreetMap) + Supabase, Vercel 배포를 전제로 합니다.

## 기능
- `/` 위험구역 지도: 기후·도로 유형·위험도 필터, 마커 클릭 시 위험요인·예방수칙·군 차량 유의사항·관련 방송 사례 표시
- **TAAS 실데이터 레이어**: 도로교통공단 사고다발지역(결빙 / 지자체별)을 시도·시군구별로 조회해 폴리곤과 마커로 표시, 클릭 시 사고·사상자·사망·중상·경상 통계 표시. "전방지역 일괄" 버튼으로 철원·화천·양구·인제·고성·연천·파주·포천·양주를 한 번에 조회
- `/learn` 상황별 교육: 기후 5종, 도로 9종, 군 차량 특화 수칙 카드
- `/cases`, `/cases/[id]` 사고 사례 23건 (출처 링크 포함)

## 데이터 구조와 주의사항
- `data/cases.json`: 방송 기사·프로그램 소개글에서 확인된 사례. 기사에 없는 항목은 `null`(화면에 "언급 없음")
- `data/zones.json`: 교육용 위험구역(예시 지점). **교육용 근사 위치**이며 실제 사고다발지점 통계가 아닙니다. 사례 자체에는 정확한 위치 정보가 거의 없어 사례와 지점은 도로·기후 유형으로 연결했습니다.
- `data/tips.json`: 본 사이트가 작성한 일반 안전운행 지침 (감속 비율은 도로교통법 시행규칙 기준)
- 영상·이미지는 포함하지 않고 요약과 출처 링크만 사용합니다.

## TAAS(도로교통공단) 실데이터 연동
공공데이터포털의 도로교통공단 오픈API 2종을 사용합니다.

| API | 활용신청 페이지 | 엔드포인트 |
|---|---|---|
| 한국도로교통공단_결빙 교통사고 다발지역 | https://www.data.go.kr/data/15058135/openapi.do | `https://apis.data.go.kr/B552061/frequentzoneFreezing/getRestFrequentzoneFreezing` |
| 한국도로교통공단_지자체별 교통사고 다발지역 | https://www.data.go.kr/data/15057467/openapi.do | `https://apis.data.go.kr/B552061/frequentzoneLg/getRestFrequentzoneLg` |

1. data.go.kr 에 로그인해 위 두 API 에 각각 **활용신청** (활용신청은 PC 화면에서 가능)
2. 마이페이지에서 일반 인증키(Encoding 또는 Decoding)를 복사
3. 로컬은 `.env.local`, 배포는 Vercel *Environment Variables* 에 `TAAS_SERVICE_KEY` 로 등록 (`NEXT_PUBLIC_` 접두사 금지: 키가 브라우저에 노출되지 않도록 `/api/taas` 서버 라우트가 대신 호출합니다)

동작 방식과 주의점
- 조회 연도는 공표가 1~2년 늦는 점을 고려해 "최신 자동"이면 작년부터 최대 3년 거슬러 올라갑니다.
- 강원(42→51)·전북(45→52) 특별자치도 개편, 군위군(경북→대구) 이동에 대비해 구·신 시도코드를 모두 시도합니다. 시군구 목록은 `data/sigungu.json` (법정동코드 기준, 248개) 입니다. 새 코드 체계에 맞게 바뀐 지역이 있으면 이 파일을 수정하세요.
- 공표 기준상 시군구당 일부 지점(상위 N개소)만 내려올 수 있습니다.
- 응답은 서버에서 24시간 캐시됩니다.
- 이 코드는 공개된 API 명세(요청 파라미터·응답 필드)를 기준으로 작성했고, 개발 환경에서는 명세와 같은 형식의 모의 서버로 검증했습니다. 실제 인증키로 첫 호출 시 응답 구조가 다르면 `lib/taas.ts` 의 `extractItems` 한 곳만 조정하면 됩니다.

## 로컬 실행
```bash
npm install
npm run dev   # http://localhost:3000
```
Supabase 환경변수가 없으면 `data/*.json` 으로 동작합니다.

## Supabase 연결
1. supabase.com 에서 프로젝트 생성
2. SQL Editor 에서 `supabase/schema.sql` 실행 → `npm run seed:sql` 로 `supabase/seed.sql` 갱신 후 실행
3. Settings > API 의 URL, anon key 를 `.env.local` 에 입력 (`.env.example` 참고)

데이터를 추가·수정하려면 Supabase 의 Table Editor 에서 행을 편집하면 5분 내 사이트에 반영됩니다.

## GitHub + Vercel 배포
```bash
git init && git add . && git commit -m "init"
git branch -M main
git remote add origin https://github.com/<계정>/<저장소>.git
git push -u origin main
```
Vercel 에서 *Add New > Project* 로 저장소를 가져오고, Environment Variables 에
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 를 등록한 뒤 Deploy 합니다.

## 지도 타일
기본값은 OpenStreetMap 공용 타일입니다. 접속량이 많아지면 별도 타일 제공자(MapTiler 등)로
`components/LeafletMap.tsx` 의 `TileLayer url` 을 교체하세요.
