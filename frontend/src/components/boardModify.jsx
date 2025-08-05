import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import axiosInstance from "../lib/axiosInstance";

export default function BoardModify() {
  const navigate = useNavigate();
  const { channelId: paramChannelId, bno } = useParams(); // /channels/:channelId/update/:bno

  const [channels, setChannels] = useState([]);
  const [channelId, setChannelId] = useState(Number(paramChannelId) || "");

  const editorRef = useRef();
  const [title, setTitle] = useState("");
  const [attachments, setAttachments] = useState([]);
  const baseImageUrl = import.meta.env.VITE_IMAGE_BASE_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 채널 목록
        axiosInstance.get("/board-channels").then((res) => setChannels(res.data));

        const res = await axiosInstance.get(`/boards/read/${bno}`);
        const { title, content, attachments } = res.data;

        setTitle(title);
        editorRef.current?.getInstance().setHTML(content || "");

        setTitle(title);
        setContent(content);
        setChannelId(channelId);

        if (attachments?.length) {
          const fixed = attachments.map((img) => ({
            originalUrl: img.originalUrl?.startsWith("http") ? img.originalUrl : `${baseImageUrl}${img.originalUrl}`,
            thumbnailUrl: img.thumbnailUrl?.startsWith("http")
              ? img.thumbnailUrl
              : `${baseImageUrl}${img.thumbnailUrl}`,
          }));
          setAttachments(fixed);
        }
      } catch (err) {
        console.error("게시글 불러오기 실패:", err);
        alert("게시글 정보를 불러오지 못했습니다.");
      }
    };

    fetchData();
  }, [bno, baseImageUrl]);

  // 🔁 이미지 업로드 후 에디터에 삽입
  const handleImagesUploaded = (newImages) => {
    setAttachments((prev) => [...prev, ...newImages]);

    const editor = editorRef.current?.getInstance();
    newImages.forEach((img) => {
      editor.insertText(`![image](${img.originalUrl})\n`);
    });
  };

  // 🖼 에디터 내 이미지 업로드 처리
  const imageUploadHook = async (blob, callback) => {
    const formData = new FormData();
    formData.append("file", blob);

    try {
      const res = await axiosInstance.post("/images/upload", formData);
      const imageUrl = res.data.originalUrl.startsWith("http")
        ? res.data.originalUrl
        : `${baseImageUrl}${res.data.originalUrl}`;

      callback(imageUrl, blob.name);
      setAttachments((prev) => [...prev, res.data]);
    } catch (err) {
      console.error("에디터 이미지 업로드 실패:", err);
      alert("이미지 업로드에 실패했습니다.");
    }
  };

  const handleSubmit = async () => {
    const content = editorRef.current?.getInstance().getHTML();

    if (!title.trim() || !content.trim()) {
      alert("제목과 본문을 모두 입력해주세요.");
      return;
    }

    try {
      await axiosInstance.put(`/boards/update/${bno}`, {
        title,
        content,
        channelId,
        attachments,
      });
      alert("게시글이 수정되었습니다.");
      navigate(`/channels/${channelId}/${bno}`);
    } catch (err) {
      console.error("게시글 수정 실패:", err);
      alert("게시글 수정에 실패했습니다.");
    }
  };

  return (
    <div
      className="max-w-5xl mx-auto mt-24 p-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
      onDrop={(e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        const editor = editorRef.current?.getInstance();

        files.forEach(async (file) => {
          if (!file.type.startsWith("image/")) return;
          if (file.size > 3 * 1024 * 1024) {
            alert(`${file.name}은(는) 3MB를 초과합니다.`);
            return;
          }

          const formData = new FormData();
          formData.append("file", file);

          try {
            const res = await axiosInstance.post("/images/upload", formData);
            const imageUrl = res.data.originalUrl.startsWith("http")
              ? res.data.originalUrl
              : `${baseImageUrl}${res.data.originalUrl}`;
            editor.insertText(`![${file.name}](${imageUrl})\n`);
            setAttachments((prev) => [...prev, res.data]);
          } catch (err) {
            alert(`❌ ${file.name} 업로드 실패`);
          }
        });
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <h2 className="text-2xl font-bold text-yellow-600 mb-6">✏️ 게시글 수정</h2>

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
        hooks={{ addImageBlobHook: imageUploadHook }}
      />

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 mr-2"
        >
          취소
        </button>
        <button onClick={handleSubmit} className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          수정 완료
        </button>
      </div>
    </div>
  );
}
