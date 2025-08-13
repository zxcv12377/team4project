// src/pages/BoardSearch.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axiosInstance";

// UI
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Icons
import { Search as SearchIcon, Tag, User, Eye, ThumbsUp, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";

export default function BoardSearch() {
  const { search } = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(search);
  const type = params.get("type");
  const keywordParam = params.get("keyword") ?? "";
  const page = parseInt(params.get("page") || "1", 10);

  const [keyword, setKeyword] = useState(keywordParam);

  const [channelsMap, setChannelsMap] = useState({}); // id -> name
  const [channelTypes, setChannelTypes] = useState({}); // id -> TYPE (e.g. INQUIRY)
  const [results, setResults] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [channelsLoading, setChannelsLoading] = useState(true);

  // ─────────────────────────────────────────
  // 1) 채널 로딩 (이름 + 타입 추론)
  // ─────────────────────────────────────────
  useEffect(() => {
    setChannelsLoading(true);
    axiosInstance
      .get("/board-channels")
      .then((res) => {
        const nameMap = {};
        const typeMap = {};
        (res.data || []).forEach((ch) => {
          const id = String(ch.id);
          nameMap[id] = ch.name;
          // 백엔드가 type을 안 내려줘도 안전하게 INQUIRY 추론
          const inferredType =
            String(ch.type || "").toUpperCase() ||
            (ch.inquiry ? "INQUIRY" : "") ||
            (/문의/i.test(ch.name || "") ? "INQUIRY" : "");
          typeMap[id] = inferredType;
        });
        setChannelsMap(nameMap);
        setChannelTypes(typeMap);
      })
      .catch(console.error)
      .finally(() => setChannelsLoading(false));
  }, []);

  // ─────────────────────────────────────────
  // 2) 검색 결과 로딩
  // ─────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get(
        `/boards/list?` +
          `type=${encodeURIComponent(type || "")}` +
          `&keyword=${encodeURIComponent(keywordParam || "")}` +
          `&page=${page}&size=10`
      )
      .then((res) => {
        const data = res.data || {};
        setResults(data.dtoList || []);
        setTotalPages(data.totalPage || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [type, keywordParam, page]);

  // INQUIRY 판정: 결과 객체에 channelType이 있으면 우선, 없으면 채널 맵으로
  const isInquiryByResult = (b) => {
    const t = String(b?.channelType || "").toUpperCase();
    if (t) return t === "INQUIRY";
    const cid = String(b.channelId);
    const mapped = String(channelTypes[cid] || "");
    if (mapped) return mapped === "INQUIRY";
    // 최후 보루: 채널명에 '문의'
    const chName = (channelsMap[cid] || "").toString();
    return /문의/i.test(chName);
  };

  // 🔒 문의 채널 글 제외
  const filteredResults = useMemo(
    () => results.filter((b) => !isInquiryByResult(b)),
    [results, channelTypes, channelsMap]
  );
  const filteredCount = filteredResults.length;
  const hiddenCount = results.length - filteredCount;

  // 날짜 포맷
  const formatDate = (iso) => {
    const d = new Date(iso);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yy}-${mm}-${dd} ${hh}:${mi}`;
  };

  // 검색어 수정 → 쿼리로 이동
  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`?type=${encodeURIComponent(type || "")}&keyword=${encodeURIComponent(keyword)}&page=1`);
  };

  const isBusy = loading || channelsLoading;

  return (
    <div className="min-h-[calc(100vh-96px)] mt-[96px] bg-consilk">
      <main className="mx-auto max-w-5xl p-6">
        {/* 헤더 */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <SearchIcon className="size-6" />
              게시글 검색
              {!isBusy && <span className="rounded-full  px-2 py-0.5 ">{filteredCount}건</span>}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">* 문의 채널의 게시글은 검색 결과에서 제외됩니다.</p>
            {!isBusy && hiddenCount > 0 && ` (제외 ${hiddenCount}건)`}
          </div>

          {/* 검색 입력 */}
          <form onSubmit={handleSubmit} className="w-full sm:w-auto ">
            <div className="relative flex w-full sm:w-96 items-center gap-2">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="검색어를 입력하세요…"
                className="pl-9 bg-white"
              />
              <Button type="submit" className="bg-red-500 text-white hover:bg-red-600">
                검색
              </Button>
            </div>
          </form>
        </div>

        {/* 로딩 상태 */}
        {isBusy ? (
          <ul className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="mb-2 h-4 w-28 rounded bg-gray-200" />
                  <div className="mb-2 h-5 w-2/3 rounded bg-gray-200" />
                  <div className="flex gap-3">
                    <div className="h-3 w-48 rounded bg-gray-100" />
                    <div className="h-3 w-32 rounded bg-gray-100" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </ul>
        ) : filteredResults.length === 0 ? (
          // 빈 상태
          <Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <SearchIcon className="mx-auto mb-3 size-8 text-gray-400" />
              <p className="text-gray-700">검색 결과가 없습니다.</p>
              <p className="mt-1 text-sm text-gray-500">다른 키워드로 다시 검색해 보세요.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 결과 리스트 */}
            <ul className="space-y-3">
              {filteredResults.map((b) => (
                <li key={b.bno}>
                  <Card
                    className="group cursor-pointer transition hover:shadow-md bg-white"
                    onClick={() => navigate(`/channels/${b.channelId}/${b.bno}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 text-xs text-white">
                        <span className="inline-flex items-center gap-1 rounded bg-gray-900 px-2 py-0.5">
                          <Tag className="size-3" />
                          {channelsMap[String(b.channelId)] ?? "알 수 없는 채널"}
                        </span>
                      </div>
                      <CardTitle className="mt-2 line-clamp-2 text-lg">
                        {b.title}
                        <span className="ml-2 align-middle text-sm text-muted-foreground">
                          (<MessageSquare className="inline size-4 mr-0.5" />
                          {b.replyCount ?? b.replyCnt ?? b.reply_count ?? b.repliesCount ?? b.replys?.length ?? 0})
                        </span>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="text-sm text-gray-600">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="inline-flex items-center gap-1">
                          <User className="size-4" />
                          {b.nickname || "익명"}
                        </span>
                        <span>{formatDate(b.createdDate)}</span>
                        <span className="inline-flex items-center gap-1">
                          <Eye className="size-4" />
                          {b.viewCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ThumbsUp className="size-4" />
                          {b.boardLikeCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="size-4" />
                          {b.replyCount ?? b.replyCnt ?? b.reply_count ?? b.repliesCount ?? b.replys?.length ?? 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>

            {/* 페이지네이션 */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() =>
                  navigate(
                    `?type=${encodeURIComponent(type || "")}&keyword=${encodeURIComponent(keywordParam)}&page=${
                      page - 1
                    }`
                  )
                }
              >
                <ChevronLeft className="mr-1 size-4" />
                이전
              </Button>

              <span className="px-3 text-sm text-gray-600">
                {page} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() =>
                  navigate(
                    `?type=${encodeURIComponent(type || "")}&keyword=${encodeURIComponent(keywordParam)}&page=${
                      page + 1
                    }`
                  )
                }
              >
                다음
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
