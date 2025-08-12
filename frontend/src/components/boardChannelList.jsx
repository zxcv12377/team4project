// src/components/BoardChannelList.jsx

import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axiosInstance";
import { useUserContext } from "./../context/UserContext";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Edit2, Trash2, Plus, Hash } from "lucide-react";

export default function BoardChannelList() {
  const [channels, setChannels] = useState([]);
  const [keyword, setKeyword] = useState("");
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

  // 필터링
  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return channels;
    return channels.filter((c) => c.name?.toLowerCase().includes(k) || c.description?.toLowerCase().includes(k));
  }, [channels, keyword]);

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

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="채널/설명 검색…"
              className="pl-9"
            />
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
          <p className="mt-1 text-sm text-gray-500">다른 키워드로 다시 검색해 보세요.</p>
        </div>
      ) : (
        // 그리드
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((ch) => (
            <li key={ch.id} className="relative">
              <Card
                onClick={() => navigate(`/channels/${ch.id}`)}
                className="group h-28 cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <CardContent className="flex h-full items-start gap-3 p-4">
                  <div className="min-w-0">
                    <div className="mb-1 line-clamp-1 text-[15px] font-semibold text-gray-900">{ch.name}</div>
                    {ch.description ? (
                      <p className="line-clamp-2 text-sm text-gray-500">{ch.description}</p>
                    ) : (
                      <p className="line-clamp-2 text-sm text-gray-400">설명이 없습니다.</p>
                    )}
                  </div>
                </CardContent>

                {/* 관리자 퀵 액션 */}
                {isAdmin && (
                  <div className="pointer-events-none absolute right-2 top-2 hidden gap-1 group-hover:flex">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="pointer-events-auto h-8 w-8"
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
                      className="pointer-events-auto h-8 w-8"
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
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
