import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "@/lib/axiosInstance";

export default function BoardModify() {
  const navigate = useNavigate();
  const { channelId: paramChannelId, bno } = useParams(); // /channels/:channelId/update/:bno

  const [channels, setChannels] = useState([]);
  const [channelId, setChannelId] = useState(Number(paramChannelId) || "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState([]);

  /* 1) 채널 목록 + 기존 게시글 데이터 로딩 */
  useEffect(() => {
    // 채널 목록
    axiosInstance.get("/board-channels").then((res) => setChannels(res.data));

    // 기존 글
    axiosInstance.get(`/boards/read/${bno}`).then((res) => {
      const { title, content, channelId, attachments } = res.data;
      setTitle(title);
      setContent(content);
      setChannelId(channelId);
      setAttachments(attachments || []);
    });
  }, [bno]);

  /* 2) 수정 */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!channelId) return alert("채널을 선택하세요");

    try {
      await axiosInstance.put(`/boards/update/${bno}`, {
        title,
        content,
        channelId,
        attachments,
      });
      navigate(`/channels/${channelId}/${bno}`);
    } catch (err) {
      console.error("수정 실패", err);
      alert("수정 실패");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-24 p-6">
      <h2 className="text-2xl font-bold mb-6">🛠 게시글 수정</h2>

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

        {/* (선택) 첨부 이미지 수정 UI */}

        <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          저장
        </button>
      </form>
    </div>
  );
}
