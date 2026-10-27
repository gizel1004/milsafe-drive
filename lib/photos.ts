import photos from "@/data/zone-photos.json";

export interface ZonePhoto {
  file: string;
  caption: string;
  match: "exact" | "nearby" | "similar";
  artist: string;
  license: string;
}

const MAP = photos as Record<string, ZonePhoto>;

export function photoFor(zoneId: string): ZonePhoto | null {
  return MAP[zoneId] ?? null;
}

/** 위키미디어 공용 썸네일 (Special:FilePath 가 해당 크기 썸네일로 연결) */
export function photoUrl(p: ZonePhoto, width = 400): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(p.file)}?width=${width}`;
}

export function photoPage(p: ZonePhoto): string {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(p.file.replace(/ /g, "_"))}`;
}

export const MATCH_LABEL: Record<ZonePhoto["match"], string> = {
  exact: "해당 구간 사진",
  nearby: "인근 구간 사진",
  similar: "유사 도로 참고 사진",
};
