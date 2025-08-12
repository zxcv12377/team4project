// src/components/BoardChannelList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axiosInstance";
import { useUserContext } from "./../context/UserContext";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Edit2, Trash2, Plus, Hash, MessageSquareLock, Megaphone, ChevronsRight, X } from "lucide-react";

export default function BoardChannelList() {
  const [channels, setChannels] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL | INQUIRY | NORMAL | NOTICE
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useUserContext();

  const isAdmin = Boolean(
    user && (user.role === "ADMIN" || (Array.isArray(user.roles) && user.roles.includes("ADMIN")))
  );

  // 채널 로딩
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/board-channels");
        setChannels(res.data || []);
      } catch (err) {
        console.error("채널 로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // 삭제
  const handleDelete = async (id) => {
    if (!window.confirm("정말 이 채널을 삭제하시겠습니까?")) return;
    try {
      await axiosInstance.delete(`/board-channels/${id}`);
      setChannels((prev) => prev.filter((ch) => ch.id !== id));
    } catch (err) {
      console.error("채널 삭제 실패:", err);
    }
  };

  // 수정
  const handleEdit = (id) => navigate(`/admin/channels/edit/${id}`);

  // 헬퍼
  const normType = (t) => String(t || "").toUpperCase();
  const isInquiry = (c) => normType(c?.type) === "INQUIRY";
  const isNotice = (c) => normType(c?.type) === "NOTICE";
  const isNormal = (c) => !isInquiry(c) && !isNotice(c);

  const typeIcon = (c) =>
    isInquiry(c) ? (
      <MessageSquareLock className="size-5 text-rose-500" />
    ) : isNotice(c) ? (
      <Megaphone className="size-5 text-amber-500" />
    ) : (
      <Hash className="size-5 text-blue-500" />
    );

  // 필터+검색
  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    let list = channels;

    if (filter === "INQUIRY") list = channels.filter(isInquiry);
    else if (filter === "NOTICE") list = channels.filter(isNotice);
    else if (filter === "NORMAL") list = channels.filter(isNormal);

    if (!k) return list;

    return list.filter(
      (c) =>
        c.name?.toLowerCase().includes(k) || c.description?.toLowerCase().includes(k) || normType(c.type).includes(k)
    );
  }, [channels, keyword, filter]);

  // 탭 버튼 컴포넌트
  const Tab = ({ value, label }) => {
    const active = filter === value;
    return (
      <Button
        type="button"
        variant={active ? "default" : "outline"}
        size="sm"
        className={`rounded-full ${active ? "" : "bg-white"}`}
        onClick={() => setFilter(value)}
      >
        {label}
      </Button>
    );
  };

  return (
    <div className="mx-auto pt-28 max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* 헤더 */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">채널 목록</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {loading ? "로드 중…" : `${filtered.length}개`}
          </span>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {/* 검색 */}
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="채널/설명/타입 검색…"
              className="pl-9"
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
      </div>

      {/* 콘텐츠 */}
      {loading ? (
        // 스켈레톤
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="h-28 animate-pulse">
              <CardContent className="h-full p-4">
                <div className="mb-2 h-5 w-1/2 rounded bg-gray-200" />
                <div className="h-3 w-4/5 rounded bg-gray-100" />
              </CardContent>
            </Card>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        // 빈 상태
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center">
          <Search className="mb-3 size-8 text-gray-400" />
          <p className="text-gray-700">검색 결과가 없습니다.</p>
          <p className="mt-1 text-sm text-gray-500">다른 키워드/필터로 다시 검색해 보세요.</p>
        </div>
      ) : (
        // 그리드
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((ch) => (
            <li key={ch.id} className="relative">
              <Card
                onClick={() => navigate(`/channels/${ch.id}`)}
                className="group h-32 cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <CardContent className="flex h-full items-stretch gap-3 p-4">
                  {/* 텍스트 */}
                  <div className="min-w-0 flex-1 flex flex-col h-full relative pb-15">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="line-clamp-1 text-[15px] font-semibold text-gray-900">{ch.name}</div>
                    </div>

                    {ch.description ? (
                      <p className="line-clamp-2 text-sm text-gray-500">{ch.description}</p>
                    ) : (
                      <p className="line-clamp-2 text-sm text-gray-400">설명이 없습니다.</p>
                    )}

                    {/* 문의 채널 안내 */}
                    {isInquiry(ch) && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 ring-1 ring-rose-100">
                        <MessageSquareLock className="size-3" />
                        작성자·관리자만 게시글 상세 접근
                      </div>
                    )}
                    {/* 관리자 퀵 액션 (설명 아래) */}
                    {isAdmin && (
                      <div className="absolute left-0 bottom-0 flex gap-1 opacity-0 transition group-hover:opacity-100">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(ch.id);
                          }}
                          title="수정"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(ch.id);
                          }}
                          title="삭제"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* 이동 아이콘 */}
                  <ChevronsRight className="ml-auto size-4 shrink-0 text-gray-300 transition group-hover:text-gray-400" />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
