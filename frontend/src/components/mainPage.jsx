// src/pages/MainPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axiosInstance";

function timeAgo(isoDate) {
  const diff = (Date.now() - new Date(isoDate)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

// 스크롤 컨테이너 참조용 객체
const scrollRefs = {};

export default function MainPage() {
  const [sections, setSections] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance
      .get("/board-channels")
      .then((res) => res.data)
      .then((channels) =>
        // 각 채널별 게시글 불러오기
        Promise.all(
          channels.map((ch) => axiosInstance.get(`/boards/channel/${ch.id}`).then((r) => ({ ...ch, posts: r.data })))
        )
      )
      .then((chWithPosts) => {
        // 1) 공지사항 & 문의하기 제외
        const filtered = chWithPosts.filter((c) => c.name !== "공지사항" && c.name !== "문의하기");

        // 2) ‘최고딸기’와 ‘전체 게시판’ 찾아 고정
        const best = filtered.find((c) => c.name === "최고딸기");

        // 3) 나머지 채널에 viewCount 합산 후 정렬
        const remaining = filtered
          .filter((c) => c.name !== "최고딸기")
          .map((c) => ({
            ...c,
            totalViews: c.posts.reduce((sum, p) => sum + (p.viewCount || 0), 0),
          }))
          .sort((a, b) => b.totalViews - a.totalViews)
          .slice(0, 4); // 상위 4개

        // 4) 최종 배열 구성
        const finalSections = [];
        if (best) finalSections.push(best);
        finalSections.push(...remaining);

        setSections(finalSections);
      })
      .catch(console.error);
  }, []);

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
                  scrollRefs[sec.id]?.scrollBy({
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
                  scrollRefs[sec.id]?.scrollBy({
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

          <ul ref={(el) => (scrollRefs[sec.id] = el)} className="flex-1 overflow-y-auto space-y-1 pr-2">
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
