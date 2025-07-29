import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "@/lib/axiosInstance";

export default function BoardCreate() {
  const navigate = useNavigate();
  const { channelId: paramChannelId } = useParams(); // /channels/:channelId/create

  const [channels, setChannels] = useState([]);
  const [channelId, setChannelId] = useState(Number(paramChannelId) || "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState([]); // ImageDTO 목록

  /* 1) 채널 목록 로딩 */
  useEffect(() => {
    axiosInstance.get("/board-channels").then((res) => setChannels(res.data));
  }, []);

  /* 2) 게시글 등록 */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!channelId) return alert("채널을 선택하세요");

    try {
      await axiosInstance.post("/boards/", {
        title,
        content,
        channelId,
        attachments,
      });
      navigate(`/channels/${channelId}`); // 글 작성 후 목록으로
    } catch (err) {
      console.error("게시글 작성 실패", err);
      alert("등록 실패");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-24 p-6">
      <h2 className="text-2xl font-bold mb-6">✏️ 게시글 작성</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 🔻 채널 선택 */}
        <div>
          <label className="block mb-1 font-medium">채널</label>
          <select
            className="w-full px-3 py-2 border rounded"
            value={channelId}
            onChange={(e) => setChannelId(Number(e.target.value))}
            required
          >
            <option value="" disabled>
              채널 선택
            </option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </select>
        </div>

        {/* 제목 */}
        <div>
          <label className="block mb-1 font-medium">제목</label>
          <input
            className="w-full px-3 py-2 border rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* 내용 */}
        <div>
          <label className="block mb-1 font-medium">내용</label>
          <textarea
            className="w-full h-40 px-3 py-2 border rounded"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        {/* (선택) 첨부 이미지 업로드 UI */}

        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          등록
        </button>
      </form>
    </div>
  );
}
