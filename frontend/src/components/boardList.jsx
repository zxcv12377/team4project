import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../lib/axiosInstance";
import { useUserContext } from "../context/UserContext";

export default function BoardList() {
  const { channelId } = useParams(); // /channels/:channelId

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [channelName, setChannelName] = useState("전체 게시판");
  const { user } = useUserContext();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const isAdmin = user?.roles?.includes("ADMIN");

  const DT_CHANNEL_ID = 1;

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
    const fetchBoards = async () => {
      try {
        setLoading(true);
        // const isBest = chanIdNum === BEST_CHANNEL_ID;
        if (channelId === "3") {
          const { data } = await axiosInstance.get(`/boards/best/channel?page=${page}&size=15`);
          console.log("베스트 게시판", data, channelId);
          setPosts(data.dtoList || []);
          setTotalPages(data.totalPage || 1);
        } else {
          const { data } = await axiosInstance.get(`/boards/channel/${channelId}?page=${page}&size=15`);
          console.log("채널 게시판", data, channelId);
          setPosts(data.dtoList || []);
          setTotalPages(data.totalPage || 1);
        }
      } catch (err) {
        console.error("게시글 로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, [channelId, page]);

  // 📆 작성일 포맷: 오늘이면 시:분, 아니면 날짜
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    return isToday
      ? date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
      : date.toLocaleDateString("ko-KR");
  };

  if (loading) {
    return <div className="text-center mt-6 text-gray-500">📦 게시글을 불러오는 중입니다...</div>;
  }

  // 📌 공지글 상단 정렬 처리
  const noticePosts = posts.filter((post) => post.notice === true || post.title?.startsWith("[공지]"));
  const normalPosts = posts.filter((post) => !(post.notice === true || post.title?.startsWith("[공지]")));
  const combinedPosts = [...noticePosts, ...normalPosts];

  return (
    <>
      <div className="max-w-6xl mx-auto shadow-inner shadow-slate-800 rounded-xl min-h-44">
        <div className="flex justify-start min-h-40 items-center">
          <img src="" alt="" className="w-[10rem] min-h-40 object-cover p-2" />
          <div className="w-full min-h-40 p-2">나야나</div>
        </div>
      </div>
      <div className="min-h-screen">
        <main className="max-w-6xl mx-auto p-6 pt-10">
          {/* 🔹 상단 등록 버튼 */}
          {token && channelId !== "1" && channelId !== "3" && channelId && (
            <div className="flex justify-end mb-4">
              <button
                className="rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600"
                onClick={() => navigate(`/channels/${channelId}/create`)}
              >
                게시글 등록
              </button>
            </div>
          )}
          {token && channelId === "1" && channelId && isAdmin && (
            <div className="flex justify-end mb-4">
              <button
                className="rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600"
                onClick={() => navigate(`/channels/${channelId}/create`)}
              >
                게시글 등록
              </button>
            </div>
          )}

          {/* 채널 이름 */}
          <h2 className="text-[20px] font-semibold mb-4 border-t-2 border-b-2 border-red-300 pl-6 pt-2 pb-2">
            {channelName} 채널
          </h2>

          {/* 🔹 게시글 테이블 감싼 카드 형태 (하얀 배경 박스) */}
          <div className="bg-white rounded-xl shadow-md p-6 border">
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="bg-gray-100 text-gray-800">
                  <tr>
                    <th className="px-3 py-2 w-[5%] text-center">번호</th>
                    <th className="px-3 py-2 w-[45%]">제목</th>
                    <th className="px-3 py-2 w-[15%] text-center">작성자</th>
                    <th className="px-3 py-2 w-[15%] text-center">작성일</th>
                    <th className="px-3 py-2 w-[10%] text-center">조회수</th>
                    <th className="px-3 py-2 w-[10%] text-center">좋아요</th>
                  </tr>
                </thead>
                <tbody>
                  {combinedPosts.map((post, index) => {
                    const isNotice = post.notice === true || post.title?.startsWith("[공지]");
                    // 페이지네이션 번호 계산 로직 수정: 현재 페이지와 전체 페이지 수를 고려하여 정확한 번호 부여
                    // 공지글이 아닌 경우에만 실제 번호를 계산하고, 공지글은 "공지"로 표시
                    const displayIndex = isNotice ? "공지" : (totalPages - page) * 15 + (combinedPosts.length - index);

                    return (
                      <tr
                        key={post.bno}
                        onClick={() => navigate(`/channels/${channelId}/${post.bno}`)}
                        className={`cursor-pointer hover:bg-gray-50 transition ${
                          isNotice ? "bg-yellow-100 font-semibold" : "bg-white"
                        }`}
                      >
                        <td className="px-3 py-3 text-center align-middle">{displayIndex}</td>
                        <td className="px-3 py-3">
                          {/* 제목에 썸네일 관련 로직이 있었으나, 테이블 구조에 맞게 제거했습니다. */}
                          <div className="text-xl font-bold text-black leading-snug mb-2 line-clamp-2">
                            {post.title}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center align-middle">{post.nickname || "익명"}</td>
                        <td className="px-3 py-3 text-center align-middle">{formatDate(post.createdDate)}</td>
                        <td className="px-3 py-3 text-center align-middle">{post.viewCount || 0}</td>
                        <td className="px-3 py-3 text-center align-middle">{post.boardLikeCount || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 게시글이 없을 때 메시지 */}
          {posts.length === 0 && !loading && <div className="text-center mt-6 text-gray-500">게시글이 없습니다.</div>}

          {/* 페이지네이션 */}
          {totalPages > 1 && ( // totalPages가 1보다 클 때만 페이지네이션 표시
            <div className="flex justify-center mt-6 gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 rounded border text-sm ${
                    page === i + 1 ? "bg-blue-500 text-white font-bold" : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
