import casesLocal from "@/data/cases.json";
import zonesLocal from "@/data/zones.json";
import tipsLocal from "@/data/tips.json";
import { getSupabase } from "./supabase";
import type { CaseItem, Tip, Zone } from "./types";

/** Supabase 환경변수가 있으면 DB에서, 없거나 실패하면 로컬 JSON에서 읽습니다. */
async function load<T>(table: string, local: T[], orderBy = "id"): Promise<T[]> {
  const sb = getSupabase();
  if (!sb) return local;
  try {
    const { data, error } = await sb.from(table).select("*").order(orderBy);
    if (error || !data || data.length === 0) return local;
    return data as T[];
  } catch {
    return local;
  }
}

export const getCases = () => load<CaseItem>("cases", casesLocal as unknown as CaseItem[]);
export const getZones = () => load<Zone>("zones", zonesLocal as unknown as Zone[]);
export const getTips = () => load<Tip>("tips", tipsLocal as unknown as Tip[]);
