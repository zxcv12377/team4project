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

// 데이터 로딩 및 가공 로직을 분리된 함수로 추출
const fetchMainPageData = async () => {
  // 1. 채널 목록 가져오기
  const { data: channels } = await axiosInstance.get("/board-channels");
  console.log("채널 목록:", channels);

  // 2. 각 채널의 게시물 정보 병렬로 가져오기
  const channelsWithPosts = await Promise.all(
    channels.map(async (channel) => {
      const { data: posts } = await axiosInstance.get(`/boards/channel/${channel.id}`);
      console.log(`채널 ${channel.name}의 게시물 목록:`, posts);
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
        // 에러 상태 처리 (예: 에러 메시지 표시)
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 데이터 가공 로직을 useMemo로 감싸서 rawSections가 변경될 때만 재계산
  const sections = useMemo(() => {
    if (!rawSections || rawSections.length === 0) return [];

    const filtered = rawSections.filter((c) => c.name !== "공지사항" && c.name !== "문의하기");
    const best = filtered.find((c) => c.name === "최고딸기");
    const remaining = filtered
      .filter((c) => c.name !== "최고딸기")
      .map((c) => ({ ...c, totalViews: c.posts.reduce((sum, p) => sum + (p.viewCount || 0), 0) }))
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, 4);

    const finalSections = [];
    if (best) finalSections.push(best);
    finalSections.push(...remaining);
    return finalSections;
  }, [rawSections]);

  if (isLoading) {
    return <div className="p-6 w-1/2 mx-auto text-center">로딩 중...</div>; // 또는 스켈레톤 UI
  }

  return (
    <div className="p-6 w-1/2 mx-auto grid grid-cols-2 grid-rows-3 divide-x divide-y border border-gray-200 bg-white">
      {sections.map((sec) => (
        <div key={sec.id} className="p-4 flex flex-col border">
          <div className="flex items-center justify-between mb-2 bg-gray-100">
            <h3
              onClick={() => navigate(`/channels/${sec.id}`)}
              className="text-lg font-semibold cursor-pointer hover:text-blue-600 truncate"
            >
              {sec.name}
            </h3>
            <div className="flex space-x-1">
              <button
                onClick={() =>
                  scrollRefs.current[sec.id]?.scrollBy({
                    left: -200,
                    behavior: "smooth",
                  })
                }
                className="p-1 rounded hover:bg-gray-100"
              >
                ‹
              </button>
              <button
                onClick={() =>
                  scrollRefs.current[sec.id]?.scrollBy({
                    left: +200,
                    behavior: "smooth",
                  })
                }
                className="p-1 rounded hover:bg-gray-100"
              >
                ›
              </button>
            </div>
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
  );
}
