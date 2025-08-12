import { useEffect, useState, useMemo } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * 관리자 – 회원 관리 페이지 (정렬 + 검색 + 삭제)
 * 열 폭이 흔들리지 않도록 table-fixed + 각 열 w-XX 지정
 */
export default function MemberMaintenance() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");

  /* ---------- 고스트 판별 유틸 ---------- */
  const GHOST_EMAIL = "deleted@local";
  const isGhost = (m) => m?.ghost === true || m?.email === GHOST_EMAIL;

  /* ---------- 데이터 로드 ---------- */
  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/members/admin/list");
      const data = Array.isArray(res.data) ? res.data : [];
      // ✅ 리스트에서 고스트 계정 제외
      const safe = data.filter((m) => !isGhost(m));
      setMembers(safe);
    } catch (err) {
      console.error("회원 목록 로딩 실패", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  /* ---------- 삭제 ---------- */
  const handleDelete = async (id) => {
    if (!window.confirm("정말로 삭제하시겠습니까?")) return;
    try {
      await axiosInstance.delete(`/members/admin/${id}`);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("회원 삭제 실패", err);
    }
  };

  /* ---------- 정렬 ---------- */
  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const compare = (a, b) => {
    const getRoleRank = (roles) => (roles?.includes("ADMIN") ? 0 : 1);
    const v1 =
      sortKey === "id"
        ? a.id
        : sortKey === "email"
        ? a.email.toLowerCase()
        : sortKey === "nickname"
        ? (a.nickname || "").toLowerCase()
        : getRoleRank(a.roles);
    const v2 =
      sortKey === "id"
        ? b.id
        : sortKey === "email"
        ? b.email.toLowerCase()
        : sortKey === "nickname"
        ? (b.nickname || "").toLowerCase()
        : getRoleRank(b.roles);
    if (v1 < v2) return sortDir === "asc" ? -1 : 1;
    if (v1 > v2) return sortDir === "asc" ? 1 : -1;
    return 0;
  };

  /* ---------- 검색 + 정렬 ---------- */
  const processed = useMemo(() => {
    const list = keyword
      ? members.filter((m) => {
          const k = keyword.toLowerCase();
          return m.email.toLowerCase().includes(k) || (m.nickname || "").toLowerCase().includes(k);
        })
      : members;
    return [...list].sort(compare);
  }, [members, keyword, sortKey, sortDir]);

  /* ---------- 렌더 ---------- */
  const thBase = "px-4 py-3 cursor-pointer select-none whitespace-nowrap font-medium";
  const sortArrow = (k) => sortKey === k && <span>{sortDir === "asc" ? "▲" : "▼"}</span>;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">회원 관리</h1>

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="이메일 또는 닉네임 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-60"
        />
        <Button className="bg-gray-100 hover:bg-white" onClick={loadMembers}>
          새로고침
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full table-fixed text-sm">
            <thead className="bg-gray-100 text-left text-xs uppercase tracking-wider">
              <tr>
                <th className={`${thBase} w-20`} onClick={() => handleSort("id")}>
                  ID {sortArrow("id")}
                </th>
                <th className={`${thBase} w-80`} onClick={() => handleSort("email")}>
                  Email {sortArrow("email")}
                </th>
                <th className={`${thBase} w-48`} onClick={() => handleSort("nickname")}>
                  Nickname {sortArrow("nickname")}
                </th>
                <th className={`${thBase} w-32`} onClick={() => handleSort("role")}>
                  Roles {sortArrow("role")}
                </th>
                <th className="px-4 py-3 w-24">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center">
                    로딩 중…
                  </td>
                </tr>
              ) : processed.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center">
                    회원이 없습니다.
                  </td>
                </tr>
              ) : (
                processed.map((m) => (
                  <tr key={m.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 w-20 truncate">{m.id}</td>
                    <td className="px-4 py-2 w-80 truncate">{m.email}</td>
                    <td className="px-4 py-2 w-48 truncate">{m.nickname}</td>
                    <td className="px-4 py-2 w-32 truncate">{(m.roles || []).join(", ")}</td>
                    <td className="px-4 py-2 w-24">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-md bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => handleDelete(m.id)}
                      >
                        삭제
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
