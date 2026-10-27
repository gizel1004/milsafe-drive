import { createClient, SupabaseClient } from "@supabase/supabase-js";

// 공개(읽기 전용) 연결 정보. 테이블은 RLS로 SELECT만 허용되어 있어 브라우저에 노출되어도 안전합니다.
// 다른 Supabase 프로젝트를 쓰려면 Vercel 환경변수로 덮어쓰면 됩니다.
const DEFAULT_URL = "https://sgyweowgfptyvmmsleoe.supabase.co";
const DEFAULT_KEY = "sb_publishable_j7Bh-0n5W3MzAMeQKBZTZg_D6vnw1nC";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key);
  return client;
}
