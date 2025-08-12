import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../lib/axiosInstance";
import { useUserContext } from "../context/UserContext";

const domain_url = import.meta.env.VITE_API_BASE_URL;

export default function BoardList() {
  const { channelId } = useParams(); // /channels/:channelId

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [banner, setBanner] = useState();
  const [channelName, setChannelName] = useState("전체 게시판");
  const [hasBanner, setHasBanner] = useState();
  const { user } = useUserContext();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const isAdmin = user?.roles?.includes("ADMIN");

  const DT_CHANNEL_ID = 1; // 사용 중이면 유지
  const isPinned = (item) => {
    // 서버가 내려준 pinned/pinScope 사용
    return Boolean(item?.pinned) || (item?.pinScope && item.pinScope !== "NONE");
  };
  useEffect(() => {
  if (!channelId) return;
  let canceled = false;

  (async () => {
    try {
      // 실제 백엔드 경로에 맞춰 수정: /banners/{id} 일 가능성 큼
      const { data } = await axiosInstance.get(`/banner/${channelId}`);
      if (!canceled) {
        setBanner(data);           // data 구조가 {path: "..."}인지 확인 필요
        setHasBanner(!!data?.path);
        if (data?.path) {
          console.log(domain_url + (data.path.startsWith("/") ? "" : "/") + data.path);
        }
      }
    } catch (e) {
      console.error("GET /banner 실패:", e?.response?.status, e?.response?.data);
      if (!canceled) {
        setBanner(null);
        setHasBanner(false);
      }
    }
  })();
  return () => { canceled = true; };
}, [channelId]);

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
        if (channelId === "3") {
          const { data } = await axiosInstance.get(`/boards/best/channel?page=${page}&size=15`);
          setPosts(data.dtoList || []);
          setTotalPages(data.totalPage || 1);
        } else {
          const { data } = await axiosInstance.get(`/boards/channel/${channelId}?page=${page}&size=15`);
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

  // 📌 공지글 상단 정렬 처리 (기존 로직 유지)
  const noticePosts = posts.filter((post) => post.notice === true || post.title?.startsWith("[공지]"));
  const normalPosts = posts.filter((post) => !(post.notice === true || post.title?.startsWith("[공지]")));
  const combinedPosts = [...noticePosts, ...normalPosts];

  return (
    <>
      <div className="relative w-[1200px] h-[200px] mx-auto rounded-xl overflow-hidden">
  {hasBanner && banner?.path ? (
    <img
      src={`${domain_url}${banner.path.startsWith("/") ? "" : "/"}${banner.path}`}
      alt="banner"
      className="absolute inset-0 w-full h-full object-cover"
    />
  ) : null}
</div>
      <div className="min-h-screen">
        <main className="max-w-6xl mx-auto p-6 pt-10">
          {/* 🔹 상단 등록 버튼 */}
          {token && channelId !== "1" && channelId !== "3" && channelId && (
            <div className="flex justify-end mb-4">
              {isAdmin && (
                <button
                  className="rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 mr-2"
                  onClick={() => navigate(`/banner/register/${channelId}`)}
                >
                  배너 등록
                </button>
              )}
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

          {/* 🔹 게시글 테이블 */}
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
                    const notice = post.notice === true || post.title?.startsWith("[공지]");
                    const pinned = isPinned(post);

                    // 번호: 공지 > "공지", 고정 > "고정", 나머지 계산
                    const displayIndex = notice
                      ? "공지"
                      : pinned
                      ? "고정"
                      : (totalPages - page) * 15 + (combinedPosts.length - index);

                    // 행 스타일: 공지(노랑) > 고정(회색) > 일반(흰색)
                    const rowClass = notice
                      ? "bg-yellow-100 font-semibold"
                      : pinned
                      ? "bg-gray-200 text-gray-600"
                      : "bg-white";

                    return (
                      <tr
                        key={post.bno}
                        onClick={() => navigate(`/channels/${channelId}/${post.bno}`)}
                        className={`cursor-pointer hover:bg-gray-50 transition ${rowClass}`}
                      >
                        <td className="px-3 py-3 text-center align-middle">{displayIndex}</td>
                        <td className="px-3 py-3">
                          <div className="text-xl font-bold leading-snug mb-2 line-clamp-2">
                            {post.title}
                            {/* 📌 고정 배지 */}
                            {pinned && (
                              <span className="ml-2 inline-flex items-center rounded px-2 py-0.5 text-xs border">
                                📌 {post.pinScope === "GLOBAL" ? "전역" : "채널"}
                              </span>
                            )}
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
          {totalPages > 1 && (
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
