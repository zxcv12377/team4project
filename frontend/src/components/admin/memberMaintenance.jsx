// src/pages/MemberMaintenance.jsx
import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  Search,
  X,
  Trash2,
  Shield,
  UserCircle2,
  Mail,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";

export default function MemberMaintenance() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");

  const GHOST_EMAIL = "deleted@local";
  const isGhost = (m) => m?.ghost === true || m?.email === GHOST_EMAIL;

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/members/admin/list");
      const data = Array.isArray(res.data) ? res.data : [];
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
  const handleDelete = async (email) => {
    if (!window.confirm("정말로 삭제하시겠습니까?")) return;
    try {
      await axiosInstance.delete(`/members/admin/${email}`);
      setMembers((prev) => prev.filter((m) => m.email !== email));
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
        ? a.email?.toLowerCase()
        : sortKey === "nickname"
        ? (a.nickname || "").toLowerCase()
        : getRoleRank(a.roles);
    const v2 =
      sortKey === "id"
        ? b.id
        : sortKey === "email"
        ? b.email?.toLowerCase()
        : sortKey === "nickname"
        ? (b.nickname || "").toLowerCase()
        : getRoleRank(b.roles);
    if (v1 < v2) return sortDir === "asc" ? -1 : 1;
    if (v1 > v2) return sortDir === "asc" ? 1 : -1;
    return 0;
  };

  const processed = useMemo(() => {
    const list = keyword
      ? members.filter((m) => {
          const k = keyword.toLowerCase();
          return m.email?.toLowerCase().includes(k) || (m.nickname || "").toLowerCase().includes(k);
        })
      : members;
    return [...list].sort(compare);
  }, [members, keyword, sortKey, sortDir]);

  const totals = useMemo(() => {
    const adminCount = members.filter((m) => m.roles?.includes("ADMIN")).length;
    return { all: members.length, admin: adminCount };
  }, [members]);

  const thBase =
    "px-4 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-gray-500 align-middle select-none";
  const sortIcon = (k) =>
    sortKey !== k ? (
      <ChevronsUpDown className="ml-1 inline-block size-3 opacity-60" />
    ) : sortDir === "asc" ? (
      <ChevronUp className="ml-1 inline-block size-3" />
    ) : (
      <ChevronDown className="ml-1 inline-block size-3" />
    );

  const Pill = ({ children, variant = "default" }) => {
    const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
    const styles =
      variant === "admin"
        ? "bg-purple-100 text-purple-700"
        : variant === "muted"
        ? "bg-gray-100 text-gray-600"
        : "bg-blue-100 text-blue-700";
    return <span className={`${base} ${styles}`}>{children}</span>;
  };

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">회원 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            총 <span className="font-semibold">{totals.all}</span>명 · 관리자{" "}
            <span className="font-semibold">{totals.admin}</span>명
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadMembers}>
            <RefreshCw className="size-4 mr-1" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="이메일 또는 닉네임 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-8 w-72"
          />
          {keyword && (
            <button
              type="button"
              aria-label="clear"
              onClick={() => setKeyword("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden ">
        <CardContent className="p-0">
          <div className="max-h-[70vh] overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-gray-50/95 backdrop-blur supports-[backdrop-filter]:bg-gray-50/70 border-b">
                <tr>
                  <th onClick={() => handleSort("id")} className={`${thBase} w-20`}>
                    <span className="inline-flex items-center">ID {sortIcon("id")}</span>
                  </th>
                  <th onClick={() => handleSort("email")} className={`${thBase} w-[28rem]`}>
                    <span className="inline-flex items-center">Email {sortIcon("email")}</span>
                  </th>
                  <th onClick={() => handleSort("nickname")} className={`${thBase} w-56`}>
                    <span className="inline-flex items-center">Nickname {sortIcon("nickname")}</span>
                  </th>
                  <th onClick={() => handleSort("role")} className={`${thBase} w-40`}>
                    <span className="inline-flex items-center">Roles {sortIcon("role")}</span>
                  </th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wider font-semibold text-gray-500 w-24">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {/* 로딩 스켈레톤 */}
                {loading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`sk_${i}`} className="animate-pulse">
                      <td className="px-4 py-3">
                        <div className="h-3 w-10 rounded bg-gray-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-3 w-64 rounded bg-gray-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-3 w-32 rounded bg-gray-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 w-20 rounded-full bg-gray-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-8 w-16 rounded bg-gray-200" />
                      </td>
                    </tr>
                  ))}

                {!loading && processed.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-500">
                      <div className="mx-auto max-w-sm space-y-2">
                        <div className="text-xl">😶‍🌫️ 결과가 없습니다</div>
                        <div className="text-sm">검색어를 바꾸거나 새로고침해 보세요.</div>
                        <div className="pt-2">
                          <Button variant="outline" onClick={loadMembers}>
                            <RefreshCw className="size-4 mr-1" />
                            새로고침
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  processed.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 align-middle">
                        <div className="inline-flex items-center gap-2">
                          <UserCircle2 className="size-4 text-gray-400" />
                          <span className="font-medium">{m.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="size-4 text-gray-400 shrink-0" />
                          <span className="truncate">{m.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="truncate">{m.nickname || <span className="text-gray-400">—</span>}</span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {m.roles?.includes("ADMIN") ? (
                          <Pill variant="admin">
                            <Shield className="size-3 mr-1" />
                            ADMIN
                          </Pill>
                        ) : (
                          <Pill variant="muted">USER</Pill>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="rounded-md  hover:bg-red-400"
                          onClick={() => handleDelete(m.email)}
                        >
                          <Trash2 className="size-4 mr-1" />
                          삭제
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
