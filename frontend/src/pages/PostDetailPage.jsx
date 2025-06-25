// src/pages/PostDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ReplyList from "../components/replyList";

const PostDetailPage = ({ name }) => {
  const { bno } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState(null);

  useEffect(() => {
    axiosInstance.get(`/board/${bno}/full`).then((res) => {
      setData(res.data);
    });
  }, [bno]);

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await axiosInstance.delete(`/board/${bno}`);
      toast({ title: "삭제 완료", description: "게시글이 삭제되었습니다." });
      navigate("/posts");
    } catch (error) {
      console.error(error);
      toast({
        title: "삭제 실패",
        description: "서버 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  if (!data) return <div className="pt-24 text-center text-zinc-500">불러오는 중...</div>;

  const { board } = data;

  return (
    <div className="min-h-screen bg-white dark:bg-[#18181b] text-black dark:text-white px-4 py-10 flex flex-col items-center transition-colors">
      <div className="w-full flex flex-col items-center">
        {/* 본문 카드 */}
        <Card
          className="
            rounded-2xl border border-zinc-300 dark:border-zinc-700 shadow
            bg-white dark:bg-[#18181b] text-black dark:text-white
            flex flex-col
            min-h-[900px]
            min-w-[1000px]
            max-w-[1100px]
            w-[1100px]      
            mx-auto
            transition-colors
          "
          style={{ boxSizing: "border-box" }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{board.title}</CardTitle>
            <div className="text-sm text-zinc-500 dark:text-zinc-400 flex justify-between items-center">
              <span>작성자 : {board.writerName}</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {new Date(board.createdDate).toLocaleString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </CardHeader>
          <CardContent
            key={board.content}
            className="flex-1 px-8 py-6 prose prose-zinc max-w-none text-black dark:text-white transition-colors"
          >
            <div dangerouslySetInnerHTML={{ __html: board.content }} />
          </CardContent>
        </Card>

        {/* 버튼 영역 */}
        <div className="flex justify-between items-center mt-2 w-full max-w-[1100px]">
          <Button
            onClick={() => navigate("/posts/new")}
            variant="outline"
            className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 
            dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 
            hover:text-zinc-800 dark:hover:text-white"
          >
            ✏️ 글쓰기
          </Button>
          <div>
            {board.writerName === name && (
              <>
                <Button
                  variant="outline"
                  className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50
                   dark:bg-green-900 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800
                    hover:text-green-800 dark:hover:text-white ml-2"
                  onClick={() => navigate(`/posts/${bno}/edit`)}
                >
                  수정
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 
                  dark:bg-red-900 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 
                  hover:text-red-800 dark:hover:text-white ml-2"
                  onClick={handleDelete}
                >
                  삭제
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 댓글 리스트 */}
        <div className="mt-14 w-full max-w-[1100px]">
          <ReplyList bno={bno} />
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
