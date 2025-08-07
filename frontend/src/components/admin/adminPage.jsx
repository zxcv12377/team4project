// src/pages/AdminPage.jsx
import { useUserContext } from "@/context/UserContext";
import { Navigate, Link } from "react-router-dom";

export default function AdminPage() {
  const { user } = useUserContext();
  if (!user?.roles?.includes("ADMIN")) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-8 text-3xl font-bold">관리자 대시보드</h1>

      {/* ✅ 채널 관리 메뉴 */}
      <ul className="space-y-2">
        <li>
          <Link to="/admin/members" className="text-blue-600 hover:underline">
            회원 관리
          </Link>
        </li>
        <li>
          <Link to="/admin/boardChannels/create" className="text-blue-600 hover:underline">
            채널 생성
          </Link>
        </li>
        <li>
          <Link to="/admin/boardChannels/delete" className="text-blue-600 hover:underline">
            채널 삭제
          </Link>
        </li>
      </ul>
    </div>
  );
}
