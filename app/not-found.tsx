import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page" style={{ textAlign: "center", padding: "60px 16px" }}>
      <h1>페이지를 찾을 수 없습니다</h1>
      <p className="lead">주소가 바뀌었거나 삭제된 페이지입니다.</p>
      <p>
        <Link href="/" className="btn" style={{ textDecoration: "none" }}>
          위험지도로 가기
        </Link>{" "}
        <Link href="/cases" className="btn ghost" style={{ textDecoration: "none" }}>
          사고 사례 보기
        </Link>
      </p>
    </div>
  );
}
