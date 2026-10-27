import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "군 차량 안전운행 교육 | 상황별 위험구역 지도",
  description: "한블리 등 방송 사례를 바탕으로 한 군 차량 사고예방 상황별 안전운행 교육 프로그램",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="topbar">
          <Link href="/" className="brand">
            <span className="brand-mark">▲</span> 군 차량 안전운행 교육
          </Link>
          <nav>
            <Link href="/">위험구역 지도</Link>
            <Link href="/learn">상황별 교육</Link>
            <Link href="/cases">사고 사례</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="footer">
          사고 사례는 방송 보도 기사·프로그램 소개글의 요약이며 영상·이미지 원본은 포함하지 않습니다. 지도의 위험구역 좌표는
          교육용 근사 위치로, 실제 사고다발지점 통계가 아닙니다. 부대 규정이 있으면 해당 규정을 우선합니다.
        </footer>
      </body>
    </html>
  );
}
