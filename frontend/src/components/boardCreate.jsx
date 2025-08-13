import { useNavigate, useParams } from "react-router-dom";
import React, { useRef, useState, useEffect } from "react";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import axiosInstance from "../lib/axiosInstance";
import { useWebSocket } from "../hooks/useWebSocket";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

export default function BoardCreate() {
  const editorRef = useRef();
  const mountedRef = useRef(true);
  const { channelId: paramChannelId } = useParams();
  const navigate = useNavigate();

  const [channels, setChannels] = useState([]);
  const [channelId, setChannelId] = useState(Number(paramChannelId) || "");
  const [title, setTitle] = useState("");
  const [attachments, setAttachments] = useState([]);

  const baseImageUrl = import.meta.env.VITE_IMAGE_BASE_URL;

  const { subscribe } = useWebSocket();

  useEffect(() => {
    // BoardCreate에서 필요한 경우만 구독
    const sub = subscribe("/topic/board-notifications", (msg) => {
      console.log("게시판 알림:", msg);
    });

    // 페이지 나갈 때 구독만 해제, 연결은 끊지 않음
    return () => {
      sub.unsubscribe();
    };
  }, [subscribe]);

  // 마운트/언마운트 여부 추적
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Editor hook 제거
      editorRef.current?.getInstance()?.removeHook?.("addImageBlobHook");
    };
  }, []);

  // 채널 목록 로드
  useEffect(() => {
    axiosInstance.get("/board-channels").then((res) => {
      if (mountedRef.current) setChannels(res.data);
    });
  }, []);

  // 이미지 업로드 함수
  const imageUploadHook = async (blob, callback) => {
    const formData = new FormData();
    formData.append("file", blob);

    try {
      const res = await axiosInstance.post("/images/upload", formData);

      const imageUrl = res.data.originalUrl.startsWith(import.meta.env.VITE_HTTP_URL)
        ? res.data.originalUrl
        : `${baseImageUrl}${res.data.originalUrl}`;

      if (mountedRef.current) {
        callback(imageUrl, blob.name);
        setAttachments((prev) => [...prev, res.data]);
      }
    } catch (err) {
      if (mountedRef.current) {
        console.error("❌ 에디터 이미지 업로드 실패:", err);
        alert("이미지 업로드에 실패했습니다.");
      }
    }
  };

  // Editor hook 등록
  useEffect(() => {
    const editorInstance = editorRef.current?.getInstance();
    if (editorInstance) {
      editorInstance.addHook("addImageBlobHook", async (blob, callback) => {
        if (!blob) return false;
        await imageUploadHook(blob, callback);
        return false; // 기본 업로드 로직 방지
      });
    }
  }, []);

  // 드래그앤드롭 업로드
  const handleDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;

    const editor = editorRef.current?.getInstance();

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        alert(`${file.name}은 이미지 형식이 아닙니다.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name}은(는) 3MB를 초과합니다.`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await axiosInstance.post("/images/upload", formData);

        const imageUrl = res.data.originalUrl.startsWith(import.meta.env.VITE_HTTP_URL)
          ? res.data.originalUrl
          : `${baseImageUrl}${res.data.originalUrl}`;

        editor?.insertText(`![${file.name}](${imageUrl})\n`);
        setAttachments((prev) => [...prev, res.data]);
      } catch (err) {
        console.error("❌ 이미지 업로드 실패:", err);
        alert(`이미지 업로드 실패: ${file.name}`);
      }
    }
  };

  // 게시글 등록
  const handleSubmit = async () => {
    const content = editorRef.current?.getInstance().getHTML();

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      await axiosInstance.post("/boards/create", {
        title,
        content,
        channelId,
        attachments,
      });
      alert("게시글이 등록되었습니다.");
      navigate(`/channels/${channelId}`);
    } catch (err) {
      console.error("❌ 게시글 등록 실패:", err);
      alert("게시글 등록에 실패했습니다.");
    }
  };

  return (
    <div
      className="max-w-5xl mx-auto mt-24 p-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <h2 className="text-2xl font-bold text-red-400 mb-6">📝 게시글 작성</h2>

      {/* 채널 선택 */}
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

      <input
        type="text"
        className="w-full mb-4 p-4 border rounded-xl"
        placeholder="제목을 입력해 주세요"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={255}
      />

      <p className="text-sm text-gray-500 mb-2">
        ✨ 이미지를 이 영역으로 드래그하면 본문에 자동 삽입되고, 저장 시 함께 등록됩니다.
      </p>

      <Editor
        ref={editorRef}
        previewStyle="vertical"
        height="500px"
        initialEditType="wysiwyg"
        placeholder="여기에 본문을 작성하세요..."
      />

      <div className="mt-4 flex justify-end">
        <button onClick={handleSubmit} className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          등록
        </button>
      </div>
    </div>
  );
}
