import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/lib/axiosInstance";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ThumbnailOrNoImage from "@/components/ui/ThumbnailOrNoImage"; // ← 썸네일 컴포넌트 import

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PostListPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [type, setType] = useState("t");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageInfo, setPageInfo] = useState(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/board", {
        params: { type, keyword, page, size: 10, sort: "DESC" },
      });
      setPosts(res.data.content);
      setPageInfo({
        page: res.data.page,
        totalPages: res.data.totalPages,
        isFirst: res.data.isFirst,
        isLast: res.data.isLast,
      });
    } catch (error) {
      console.error("게시글 불러오기 실패", error);
    }
  }, [type, keyword, page]);

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, keyword, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  return (
    <div className="min-h-screen pt-24 bg-[#fafbfc] dark:bg-[#18181b]">
      {/* 게시글 목록 */}
      <div className="max-w-[1600px] w-full mx-auto">
        {/* 리스트 타이틀 */}
        <div className="flex items-center mb-2 pl-1">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">📋 게시글 목록</h2>
        </div>
        {/* 검색바 상단 중앙 */}
        <form onSubmit={handleSearch} className="flex justify-center items-center gap-2 mb-10">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none"
          >
            <option value="t">제목</option>
            <option value="c">내용</option>
            <option value="w">작성자</option>
            <option value="tc">제목+내용</option>
          </select>
          <Input
            className="w-64 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200"
            placeholder="검색어를 입력하세요"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Button
            type="submit"
            className="rounded-lg bg-neutral-100 dark:bg-zinc-800 text-zinc-700 dark:text-gray-100 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition font-medium shadow-none"
          >
            🔍 검색
          </Button>
        </form>
        {/* 글쓰기 버튼 */}
        <div className="w-full flex justify-end mt-6">
          <Button
            onClick={() => navigate("/posts/new")}
            className="rounded-lg border-none ml-auto px-6 py-3 font-medium bg-zinc-100 dark:bg-zinc-700 text-white-700 dark:text-white-300 hover:bg-white-100 dark:hover:bg-white-800 hover:text-white-800 dark:hover:text-white transition flex items-center gap-2 shadow-none"
            style={{ minWidth: 92 }}
          >
            <span className="text-base">✏️</span> 글쓰기
          </Button>
        </div>
        {/* 칼럼 헤더 */}
        <div className="border-t border-gray-200 dark:border-gray-800 mb-0" />
        <div className="flex items-center px-8 py-2 border-b border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-300 font-semibold bg-zinc-50 dark:bg-zinc-800 rounded-t-xl gap-8">
          <div className="w-14 text-center">No</div>
          <div className="w-32 text-center">썸네일</div>
          <div className="w-[900px] text-center pl-4">제목</div>
          <div className="w-48 text-center">작성자</div>
          <div className="w-60 text-center">날짜</div>
        </div>

        {posts.length === 0 ? (
          <div className="text-zinc-400 dark:text-zinc-600 text-center py-16">게시글이 없습니다.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {posts.map((post, idx) => (
              <div
                key={post.bno}
                className="flex items-center bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-700 px-8 py-2 shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900 transition cursor-pointer gap-8"
                onClick={() => navigate(`/posts/${post.bno}`)}
                style={{ minHeight: 56 }}
              >
                {/* 번호 */}
                <div className="w-14 text-center text-zinc-400 font-semibold">
                  {posts.length - idx + (page - 1) * 10}
                </div>
                {/* 썸네일 */}
                <ThumbnailOrNoImage bno={post.bno} />
                {/* 제목 */}
                <div className="w-[900px] font-medium text-zinc-800 dark:text-white pl-20">{post.title}</div>
                {/* 작성자 */}
                <div className="w-48 text-center text-zinc-700 dark:text-zinc-200">{post.writerName}</div>
                {/* 날짜 */}
                <div className="w-60 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                  {formatDate(post.createdDate)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이징 + 글쓰기 버튼 오른쪽 정렬 */}
        <div className="flex flex-col items-center mt-6 w-full max-w-[1600px] mx-auto">
          <div className="flex justify-center w-full">
            {pageInfo && (
              <div className="flex items-center gap-2 py-2">
                <Button
                  onClick={() => setPage((prev) => prev - 1)}
                  disabled={pageInfo.isFirst}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-neutral-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200 hover:bg-neutral-200 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-white px-4 py-1 text-sm font-medium"
                  variant="outline"
                >
                  ◀ 이전
                </Button>
                <span className="text-sm text-zinc-400 dark:text-zinc-500 select-none ">
                  {pageInfo.page + 1} / {pageInfo.totalPages}
                </span>
                <Button
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={pageInfo.isLast}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-neutral-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200 hover:bg-neutral-200 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-white px-4 py-1 text-sm font-medium"
                  variant="outline"
                >
                  다음 ▶
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostListPage;
