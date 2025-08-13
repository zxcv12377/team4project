import { useEffect, useState } from "react";
import axiosInstance from "../lib/axiosInstance";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// UI
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Icons
import { Tag, Calendar as CalendarIcon, Trash2, MessageSquare } from "lucide-react";

const fmt = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yy}-${mm}-${dd} ${hh}:${mi}`;
};

export default function MyReply() {
  const [replies, setReplies] = useState([]);
  const [channelsMap, setChannelsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [chRes, repRes] = await Promise.all([
          axiosInstance.get("/board-channels"),
          axiosInstance.get("/replies/my"),
        ]);

        const map = {};
        (chRes.data || []).forEach((ch) => (map[String(ch.id)] = ch.name));
        setChannelsMap(map);

        setReplies(Array.isArray(repRes.data) ? repRes.data : []);
      } catch (err) {
        console.error("댓글/채널 로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const markdownComponents = {
    img: (props) => <img {...props} alt={props.alt ?? ""} className="inline-block max-w-full h-auto align-middle" />,
  };

  const handleDelete = async (e, rno) => {
    e.stopPropagation();
    if (!window.confirm("정말로 댓글을 삭제하시겠습니까?")) return;
    try {
      await axiosInstance.delete(`/replies/${rno}`);
      setReplies((prev) => prev.filter((r) => r.rno !== rno));
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl pt-28 px-4">
      <header className="mb-6">
        <h2 className="text-3xl font-bold">내가 작성한 댓글</h2>
        <p className="text-sm text-muted-foreground mt-1">내 댓글이 달린 글로 이동할 수 있어요.</p>
      </header>

      {/* 로딩 스켈레톤 */}
      {loading ? (
        <ul className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="mb-2 h-4 w-24 rounded bg-gray-200" />
                <div className="mb-2 h-5 w-4/5 rounded bg-gray-200" />
                <div className="h-3 w-52 rounded bg-gray-100" />
              </CardContent>
            </Card>
          ))}
        </ul>
      ) : replies.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-gray-600">작성한 댓글이 없습니다.</CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {replies.map((reply) => {
            const channelName = channelsMap[String(reply.channelId)] ?? "알 수 없는 채널";
            return (
              <li key={reply.rno}>
                <Card
                  className="group cursor-pointer transition hover:shadow-md bg-white"
                  onClick={() => navigate(`/channels/${reply.channelId}/${reply.bno}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="text-xs text-white">
                      <span className="inline-flex items-center gap-1 rounded bg-gray-900 px-2 py-0.5">
                        <Tag className="size-3" />
                        {channelName}
                      </span>
                    </div>
                    <CardTitle className="mt-2 text-base flex items-center gap-2 text-gray-700">
                      <MessageSquare className="size-4" />내 댓글
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="prose prose-sm max-w-none text-gray-800">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {reply.text}
                      </ReactMarkdown>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 inline-flex items-center gap-1">
                      <CalendarIcon className="size-4" />
                      {fmt(reply.createdDate)}
                    </div>
                  </CardContent>

                  <CardFooter className="justify-end">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => handleDelete(e, reply.rno)}
                      className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white rounded-xl"
                    >
                      <Trash2 className="size-4" />
                      삭제
                    </Button>
                  </CardFooter>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
