import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "제보 관리 | 군 차량 안전운행 교육",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
