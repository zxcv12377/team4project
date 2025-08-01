import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../lib/axiosInstance";

export default function BoardList() {
  const { channelId } = useParams(); // /channels/:channelId
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [channelName, setChannelName] = useState("전체 게시판");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  // 채널 이름 로딩
  useEffect(() => {
    if (!channelId) {
      setChannelName("전체 게시판");
      return;
    }
    axiosInstance
      .get(`/board-channels/${channelId}`) // id 기반 조회
      .then((res) => setChannelName(res.data.name))
      .catch(() => setChannelName(`채널 ${channelId}`));
  }, [channelId]);

  /* ---------- 게시글 로딩 ---------- */
  useEffect(() => {
    boardList();
  }, [channelId, page]);

  const boardList = async () => {
    try {
      const res = channelId
        ? await axiosInstance.get(`/boards/channel/${channelId}?page=${page}&size=10`, { headers })
        : await axiosInstance.get(`/boards/list?page=${page}&size=10`, { headers });

      const data = res.data;
      if (Array.isArray(data)) {
        setPosts(data);
        setTotalPages(1);
      } else {
        setPosts(data.dtoList || []);
        setTotalPages(data.totalPage || 1);
      }
    } catch (err) {
      console.error("게시글 로딩 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- 렌더 ---------- */
  if (loading) return <div className="mt-6 text-center text-gray-500">📦 게시글을 불러오는 중입니다...</div>;

  return (
    <div className="min-h-[calc(100vh-96px)] mt-[96px] bg-consilk">
      <main className="mx-auto max-w-3xl p-6 pt-10">
        {/* 등록 버튼 */}
        {token && channelId && (
          <div className="mb-4 flex justify-end">
            <button
              className="rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600"
              onClick={() => navigate(`/channels/${channelId}/create`)}
            >
              게시글 등록
            </button>
          </div>
        )}

        {/* 채널 이름 */}
        <h2 className="mb-4 text-2xl font-bold">📋 {channelName}</h2>

        {/* 게시글 목록 ... (이하 동일) */}
        {posts.length === 0 ? (
          <div className="mt-6 text-center text-gray-600">📭 게시글이 없습니다.</div>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.bno} className="rounded-lg bg-white p-4 shadow hover:shadow-lg transition-shadow">
                <h3
                  className="text-xl font-semibold cursor-pointer"
                  onClick={() => navigate(`/channels/${channelId}/${post.bno}`)}
                >
                  {post.title}
                </h3>
                <p className="text-gray-500 text-sm">
                  작성자: {post.nickname} | 조회수: {post.viewCount}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
