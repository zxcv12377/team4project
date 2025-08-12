import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../lib/axiosInstance";
import { useUserContext } from "../context/UserContext";

const domain_url = import.meta.env.VITE_API_BASE_URL;

export default function BoardList() {
  const { channelId } = useParams(); // /channels/:channelId
  const navigate = useNavigate();
  const { user } = useUserContext();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [banner, setBanner] = useState();
  const [channelName, setChannelName] = useState("전체 게시판");
  const [channelType, setChannelType] = useState(null); // 'INQUIRY' | 'NOTICE' | 'NORMAL'

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  // 컨텍스트가 아직 준비 안 됐는데 토큰이 있으면, 판단을 미룸
  const userReady = useMemo(() => (token ? !!user : true), [token, user]);
  const isAdmin = !!user?.roles?.includes("ADMIN");

  const DT_CHANNEL_ID = 1; // 사용 중이면 유지
  const isPinned = (item) => {
    // 서버가 내려준 pinned/pinScope 사용
    return Boolean(item?.pinned) || (item?.pinScope && item.pinScope !== "NONE");
  };
  useEffect(() => {
    if (!channelId) return;

    let ignore = false; // 언마운트 안전장치

    (async () => {
      try {
        const { data } = await axiosInstance.get(`/banner/${channelId}`);
        // console.log(data);
        if (!ignore) {
          setBanner(data); // setBanner(res) 말고 data만
        }
      } catch (e) {
        console.error("GET /banner 실패:", e);
      }
      console.log(domain_url + banner.path);
    })();

    return () => {
      ignore = true;
    };
  }, [channelId]);

  // 채널 정보 로딩(이름/타입)
  useEffect(() => {
    if (!channelId) {
      setChannelName("전체 게시판");
      setChannelType(null);
      return;
    }
    axiosInstance
      .get(`/board-channels/${channelId}`)
      .then((res) => {
        setChannelName(res.data?.name ?? `채널 ${channelId}`);
        setChannelType(res.data?.type || res.data?.channelType || null);
      })
      .catch(() => {
        setChannelName(`채널 ${channelId}`);
        setChannelType(null);
      });
  }, [channelId]);

  // 게시글 로딩
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setLoading(true);
        if (channelId === "3") {
          // 프로젝트 특수: 최고딸기 채널
          const { data } = await axiosInstance.get(`/boards/best/channel?page=${page}&size=15`);
          setPosts(data?.dtoList || []);
          setTotalPages(Number(data?.totalPage || 1));
        } else {
          const { data } = await axiosInstance.get(`/boards/channel/${channelId}?page=${page}&size=15`);
          setPosts(data?.dtoList || []);
          setTotalPages(Number(data?.totalPage || 1));
        }
      } catch (err) {
        console.error("게시글 로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBoards();
  }, [channelId, page]);

  // 유틸
  const isInquiryChannel = () => {
    const t = String(channelType || "").toUpperCase();
    if (t) return t === "INQUIRY";
    return typeof channelName === "string" && /문의/i.test(channelName); // 타입이 없으면 이름으로 판정
  };
  const getAuthorId = (p) => {
    const cand = [p?.memberId, p?.memberid, p?.member?.id];
    for (const v of cand) {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
    return null;
  };
  const isAuthor = (p) => {
    const a = getAuthorId(p);
    return !!user && a != null && Number(user.id) === Number(a);
  };

  // 목록에서 클릭 차단
  const handleRowClick = (post) => {
    if (!userReady) return; // 사용자 정보가 아직이면 판단 보류 (깜빡 차단 방지)
    if (isInquiryChannel() && !(isAdmin || isAuthor(post))) {
      alert("작성자와 관리자만 열람 가능한 비공개 문의입니다.");
      return;
    }
    // 상세에서 한 번 더 검증하므로 메타 없이 그대로 이동해도 됨
    navigate(`/channels/${channelId}/${post.bno}`);
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const t = new Date();
    const isToday = d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
    return isToday
      ? d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
      : d.toLocaleDateString("ko-KR");
  };

  if (loading || !userReady) {
    return <div className="text-center mt-6 text-gray-500">📦 불러오는 중…</div>;
  }

  // 공지/일반 분리(기존 규칙 호환)
  const noticePosts = posts.filter((p) => p?.notice === true || p?.title?.startsWith?.("[공지]"));
  const normalPosts = posts.filter((p) => !(p?.notice === true || p?.title?.startsWith?.("[공지]")));
  const combinedPosts = [...noticePosts, ...normalPosts];

  return (
    <>
      <div className="relative w-[1200px] h-[200px] mx-auto rounded-xl overflow-hidden">
        {/* <img src={`${domain_url}${banner.path}`} alt="banner" className="absolute inset-0 w-full h-full object-cover" /> */}
      </div>
      <div className="min-h-screen">
        <main className="max-w-6xl mx-auto p-6 pt-10">
          {/* 상단 등록 버튼 (기존 유지) */}
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

          {/* 게시글 테이블 */}
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
                    const notice = post?.notice === true || post?.title?.startsWith?.("[공지]");
                    const pinned = isPinned(post);

                    const masked = isInquiryChannel() && !(isAdmin || isAuthor(post));
                    const displayTitle = masked ? "비공개 게시글입니다" : post?.title;
                    const displayWriter = masked ? "작성자 비공개" : post?.nickname || "익명";

                    const rowClass = notice
                      ? "bg-yellow-100 font-semibold"
                      : pinned
                      ? "bg-gray-200 text-gray-600"
                      : masked
                      ? "bg-gray-50 text-gray-500"
                      : "bg-white";

                    // 번호: 공지/고정 표기 → 나머지는 간단 표기
                    const displayIndex = notice ? "공지" : pinned ? "고정" : index + 1;

                    return (
                      <tr
                        key={post.bno}
                        onClick={() => handleRowClick(post)}
                        className={`cursor-pointer hover:bg-gray-50 transition ${rowClass}`}
                      >
                        <td className="px-3 py-3 text-center align-middle">{displayIndex}</td>
                        <td className="px-3 py-3">
                          <div className="text-xl font-bold leading-snug mb-2 line-clamp-2">
                            {displayTitle}
                            {pinned && (
                              <span className="ml-2 inline-flex items-center rounded px-2 py-0.5 text-xs border">
                                📌 {post.pinScope === "GLOBAL" ? "전역" : "채널"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center align-middle">{displayWriter}</td>
                        <td className="px-3 py-3 text-center align-middle">{formatDate(post?.createdDate)}</td>
                        <td className="px-3 py-3 text-center align-middle">{post?.viewCount ?? 0}</td>
                        <td className="px-3 py-3 text-center align-middle">{post?.boardLikeCount ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

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
          </div>
        </main>
      </div>
    </>
  );
}
