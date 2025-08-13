// src/pages/AdminPage.jsx
import { Navigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUserContext } from "@/context/UserContext";
import axiosInstance from "@/lib/axiosInstance";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, FolderPlus, Wrench, MessageSquare, RefreshCw, ChevronsRight } from "lucide-react";

export default function AdminPage() {
  // ✅ 모든 훅은 최상단에서 호출
  const { user } = useUserContext();
  const isAdmin = !!user?.roles?.includes("ADMIN");

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ members: null, channels: null, todayInquiries: null });
  const [inquiryChannelId, setInquiryChannelId] = useState(null);
  const [err, setErr] = useState(null);

  // KST 기준 '오늘' 판정
  const isToday = (iso) => {
    if (!iso) return false;
    const d = new Date(iso);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };

  const isInquiryChannel = (c) => String(c?.type || "").toUpperCase() === "INQUIRY" || /문의/i.test(c?.name || "");

  const fetchMembersCount = async () => {
    try {
      const { data } = await axiosInstance.get("/members/count");
      if (typeof data === "number") return data;
      if (typeof data?.count === "number") return data.count;
    } catch (e) {
      console.debug("GET /members/count 실패 – 폴백 사용", e?.response?.status);
    }
    try {
      const { data } = await axiosInstance.get("/members?page=1&size=1");
      const total = data?.totalElements ?? data?.total ?? data?.totalCount;
      if (typeof total === "number") return total;
      if (Array.isArray(data)) return data.length;
      if (Array.isArray(data?.content)) return data.content.length;
    } catch (e) {
      throw new Error("회원 수 조회 실패");
    }
    throw new Error("회원 수 응답 형식 알 수 없음");
  };

  const fetchChannels = async () => {
    const { data } = await axiosInstance.get("/board-channels");
    return Array.isArray(data) ? data : data?.channels || [];
  };

  const fetchTodayInquiries = async (inquiryChannelIds) => {
    if (!inquiryChannelIds.length) return 0;
    let total = 0;
    for (const id of inquiryChannelIds) {
      try {
        const size = 200;
        const { data } = await axiosInstance.get(`/boards/channel/${id}?page=1&size=${size}`);
        const list = data?.dtoList || data?.content || [];
        total += list.filter((p) => isToday(p?.createdDate)).length;

        const totalPage = Number(data?.totalPage || data?.totalPages || 1);
        for (let page = 2; page <= Math.min(totalPage, 5); page++) {
          const { data: d } = await axiosInstance.get(`/boards/channel/${id}?page=${page}&size=${size}`);
          const l = d?.dtoList || d?.content || [];
          total += l.filter((p) => isToday(p?.createdDate)).length;
        }
      } catch (e) {
        console.warn("오늘 문의 카운트 실패 (channelId:", id, ")", e?.response?.status);
      }
    }
    return total;
  };

  const load = async () => {
    if (!isAdmin) return; // ✅ 비관리자는 실행 안 함(훅은 이미 호출됨)
    setLoading(true);
    setErr(null);
    try {
      const channels = await fetchChannels();
      const channelsCount = channels.length;
      const inquiryIds = channels.filter(isInquiryChannel).map((c) => c.id);
      setInquiryChannelId(inquiryIds[0] ?? null);

      const membersCount = await fetchMembersCount();
      const todayInquiries = await fetchTodayInquiries(inquiryIds);

      setStats({ members: membersCount, channels: channelsCount, todayInquiries });
    } catch (e) {
      console.error(e);
      setErr(e?.message || "대시보드 데이터 로딩 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isAdmin]);

  if (!isAdmin) return <Navigate to="/" replace />;

  const Num = ({ value }) => <div className="text-3xl font-bold tabular-nums">{loading ? "…" : value ?? "—"}</div>;

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-8">
      {/* 헤더 */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LayoutDashboard className="size-7" />
            관리자 대시보드
          </h1>
          <p className="text-muted-foreground mt-1">자주 쓰는 관리자 기능을 빠르게 이용하세요.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}>
            <RefreshCw className="size-4 mr-1" />
            새로고침
          </Button>
        </div>
      </header>

      {/* 에러 알림 */}
      {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      {/* 요약 카드 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">총 회원 수</CardTitle>
            <Num value={stats.members} />
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">탈퇴한 사용자 포함된 집계</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">채널 수</CardTitle>
            <Num value={stats.channels} />
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">공지사항&문의하기 채널이 포함된 집계</CardContent>
        </Card>

        <Card className="relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">오늘 작성된 문의글</CardTitle>
            <Num value={stats.todayInquiries} />
            {/* 문의 채널로 이동 */}
            {inquiryChannelId && (
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                title="문의하기 채널로 이동"
              >
                <Link to={`/channels/${inquiryChannelId}`}>
                  <ChevronsRight className="size-4" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">00시 00분 기준</CardContent>
        </Card>
      </section>

      {/* 빠른 작업 */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              회원 관리
            </CardTitle>
            <CardDescription>회원 조회 · 권한 변경 · 제재 관리</CardDescription>
          </CardHeader>
          <CardFooter className="justify-end">
            <Button asChild className="bg-black text-white hover:bg-gray-500">
              <Link to="/admin/members">열기</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderPlus className="size-5" />
              채널 생성
            </CardTitle>
            <CardDescription>게시판 채널 추가 및 속성 설정</CardDescription>
          </CardHeader>
          <CardFooter className="justify-end">
            <Button asChild className="bg-black text-white hover:bg-gray-500">
              <Link to="/admin/boardChannels/create">열기</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="size-5" />
              베리콘
            </CardTitle>
            <CardDescription>운영 도구 · 유틸리티</CardDescription>
          </CardHeader>
          <CardFooter className="justify-end">
            <Button asChild className="bg-black text-white hover:bg-gray-500">
              <Link to="/admin/verrycon">열기</Link>
            </Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}
