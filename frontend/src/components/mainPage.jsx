import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axiosInstance";

function timeAgo(isoDate) {
  const diff = (Date.now() - new Date(isoDate)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

// 전역 고정글 제외 필터 유틸
const excludeGlobalPins = (arr) =>
  (Array.isArray(arr) ? arr : []).filter((p) => String(p?.pinScope || "NONE").toUpperCase() !== "GLOBAL");

// 데이터 로딩 및 가공 로직을 분리된 함수로 추출
const fetchMainPageData = async () => {
  // 1. 채널 목록 가져오기
  const { data: channels } = await axiosInstance.get("/board-channels");

  // 2. 각 채널의 게시물 정보 병렬로 가져오기
  const channelsWithPosts = await Promise.all(
    channels.map(async (channel) => {
      // 베스트 게시판은 일반 채널이랑 다른 주소를 가짐
      const listUrl = channel.id === 3 ? "/boards/best/channel" : `/boards/channel/${channel.id}`;

      const { data: pageResult } = await axiosInstance.get(listUrl, {
        params: { page: 1, size: 8 },
      });

      // dtoList 로 실제 배열 추출, 전역 고정글 제외
      const raw = Array.isArray(pageResult.dtoList) ? pageResult.dtoList : [];
      const posts = excludeGlobalPins(raw); // ✅ 메인에서만 GLOBAL 숨김

      return { ...channel, posts };
    })
  );
  return channelsWithPosts;
};

export default function MainPage() {
  const [rawSections, setRawSections] = useState([]); // 원본 데이터 상태
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가
  const navigate = useNavigate();
  const scrollRefs = useRef({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchMainPageData();
        setRawSections(data);
      } catch (error) {
        console.error("메인 페이지 데이터 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 데이터 가공
  const sections = useMemo(() => {
    if (!rawSections || rawSections.length === 0) return [];

    const filtered = rawSections.filter(
      // 공지사항, 문의하기, 전체게시판은 메인페이지에 띄우지 않음
      (c) => c.name !== "공지사항" && c.name !== "문의하기" && c.name !== "전체게시판"
    );

    // 메인 페이지에 최초는 무조건 베스트 게시판
    const best = filtered.find((c) => c.name === "최고딸기 게시판");
    const remaining = filtered
      .filter((c) => c.name !== "최고딸기 게시판")
      .map((c) => ({ ...c, totalViews: c.posts.reduce((sum, p) => sum + (p.viewCount || 0), 0) }))
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, 8);

    const finalSections = [];
    if (best) finalSections.push(best);
    finalSections.push(...remaining);
    return finalSections;
  }, [rawSections]);

  if (isLoading) {
    return <div className="p-6 w-1/2 mx-auto text-center">로딩 중...</div>;
  }

  return (
    <>
      {/* 배너 */}
      <div className="mx-auto max-w-6xl h-[8rem] bg-red-50 mb-4 rounded-xl border-t-2 border-b-2 border-red-300 ">
        <img src="likedis.png" alt="banner" className="w-full h-full object-cover rounded-xl" />
      </div>
      {/* 메인 채널 */}
      <div className="p-6 max-w-6xl mx-auto grid grid-cols-2 grid-rows-3 border border-gray-200 bg-white">
        {sections.map((sec, idx) => (
          <div
            key={sec.id}
            className={
              idx % 2 === 0 ? "p-4 flex flex-col border-gray-300" : "p-4 flex flex-col border-l border-gray-300"
            }
          >
            <div className="flex items-center justify-between mb-2 bg-gray-100 border-t-2 border-red-300">
              <h3
                onClick={() => navigate(`/channels/${sec.id}`)}
                className="p-2 text-lg font-semibold cursor-pointer hover:text-blue-600 truncate"
              >
                {sec.name} 채널
              </h3>
            </div>

            <ul ref={(el) => (scrollRefs.current[sec.id] = el)} className="flex-1 overflow-y-auto space-y-1 pr-2">
              {sec.posts
                .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
                .slice(0, 8)
                .map((post) => (
                  <li
                    key={post.bno}
                    onClick={() => navigate(`/channels/${sec.id}/${post.bno}`)}
                    className="flex justify-between items-center cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5"
                  >
                    <span className="text-sm text-gray-800 truncate">
                      [{post.bno}] {post.title}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 whitespace-nowrap">
                      {timeAgo(post.createdDate)} [{post.viewCount || 0}]
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
