// src/pages/AdminPage.jsx
import { useUserContext } from "@/context/UserContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function AdminPage() {
  const { user } = useUserContext();

  // 비관리자 접근 시 홈으로 리다이렉트
  if (!user?.roles?.includes("ADMIN")) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-8 text-3xl font-bold">관리자 대시보드</h1>
      <Link to="/admin/members">회원관리</Link>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"></div>
    </div>
  );
}
