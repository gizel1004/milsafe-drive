import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

const DESC = "기후·도로별 위험구역 지도와 방송 사고사례로 배우는 군 차량 사고예방 안전운행 교육";

export const metadata: Metadata = {
  metadataBase: new URL("https://milsafe-drive.vercel.app"),
  title: "군 차량 안전운행 교육 | 상황별 위험구역 지도",
  description: DESC,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "군 차량 안전운행 교육",
    title: "군 차량 안전운행 교육 | 상황별 위험구역 지도",
    description: DESC,
  },
  twitter: { card: "summary_large_image", title: "군 차량 안전운행 교육", description: DESC },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e2a3a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="topbar">
          <Link href="/" className="brand">
            <span className="brand-mark">▲</span> 군 차량 안전운행 교육
          </Link>
          <nav>
            <Link href="/">위험지도</Link>
            <Link href="/learn">상황별 교육</Link>
            <Link href="/cases">사고 사례</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="footer">
          사고 사례는 방송 보도 기사·프로그램 소개글의 요약이며 영상·이미지 원본은 포함하지 않습니다. 지도의 위험구역 좌표는
          교육용 근사 위치로, 실제 사고다발지점 통계가 아닙니다. 점선 테두리 지점은 현장 제보를 관리자가 승인한 곳입니다. 부대 규정이 있으면 해당 규정을 우선합니다.{" "}
          <Link href="/admin" style={{ color: "inherit" }}>관리자</Link>
        </footer>
      </body>
    </html>
  );
}
