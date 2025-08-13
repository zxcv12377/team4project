import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axiosInstance";

// UI
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Icons
import { Tag, Calendar as CalendarIcon, Trash2 } from "lucide-react";

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

export default function MyBoard() {
  const [posts, setPosts] = useState([]);
  const [channelsMap, setChannelsMap] = useState({}); // id -> name
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [chRes, postRes] = await Promise.all([
        axiosInstance.get("/board-channels"),
        axiosInstance.get("/boards/my"),
      ]);

      const map = {};
      (chRes.data || []).forEach((ch) => (map[String(ch.id)] = ch.name));
      setChannelsMap(map);

      setPosts(Array.isArray(postRes.data) ? postRes.data : []);
    } catch (err) {
      console.error("내 글/채널 로딩 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleDelete = async (e, bno) => {
    e.stopPropagation();
    if (!window.confirm("정말로 게시글을 삭제하시겠습니까?")) return;
    try {
      await axiosInstance.delete(`/boards/delete/${bno}`);
      setPosts((prev) => prev.filter((p) => p.bno !== bno));
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl pt-28 px-4">
      <header className="mb-6">
        <h2 className="text-3xl font-bold">내가 작성한 게시글</h2>
        <p className="text-sm text-muted-foreground mt-1">내가 쓴 글 목록이에요.</p>
      </header>

      {/* 로딩 스켈레톤 */}
      {loading ? (
        <ul className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="mb-2 h-4 w-24 rounded bg-gray-200" />
                <div className="mb-2 h-5 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-40 rounded bg-gray-100" />
              </CardContent>
            </Card>
          ))}
        </ul>
      ) : posts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-gray-600">작성한 게시글이 없습니다.</CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => {
            const channelName = channelsMap[String(post.channelId)] ?? "알 수 없는 채널";
            return (
              <li key={post.bno}>
                <Card
                  className="group cursor-pointer transition hover:shadow-md bg-white"
                  onClick={() => navigate(`/channels/${post.channelId}/${post.bno}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="text-xs text-white">
                      <span className="inline-flex items-center gap-1 rounded bg-gray-900 px-2 py-0.5">
                        <Tag className="size-3" />
                        {channelName}
                      </span>
                    </div>
                    <CardTitle className="mt-2 line-clamp-2 text-lg">{post.title}</CardTitle>
                  </CardHeader>

                  <CardContent className="text-sm text-gray-600">
                    <div className="inline-flex items-center gap-1">
                      <CalendarIcon className="size-4" />
                      {fmt(post.createdDate)}
                    </div>
                  </CardContent>

                  <CardFooter className="justify-end">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => handleDelete(e, post.bno)}
                      className=" rounded-xl inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white"
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
