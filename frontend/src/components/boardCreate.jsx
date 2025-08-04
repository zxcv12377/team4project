import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import axiosInstance from "../lib/axiosInstance";
// / (URL 기반 이미지 삽입 방식의 BOARD CREATE)

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

export default function BoardCreate() {
  const editorRef = useRef();
  const [title, setTitle] = useState("");
  const [attachments, setAttachments] = useState([]); // 이미지 정보 리스트
  const navigate = useNavigate();

  // 이미지 출력용 URL은 /api 없이
  const baseImageUrl = import.meta.env.VITE_IMAGE_BASE_URL; // 예: http://localhost:8080

  // 🔄 에디터 초기화(새 글 작성 시 editor 초기화)
  useEffect(() => {
    editorRef.current?.getInstance().setHTML("");
  }, []);

  // 📥 드래그 앤 드롭 이미지 업로드
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

        // 이미지 src는 baseImageUrl로 출력
        const imageUrl = res.data.originalUrl.startsWith("http")
          ? res.data.originalUrl
          : `${baseImageUrl}${res.data.originalUrl}`;

        editor.insertText(`![${file.name}](${imageUrl})\n`);
        setAttachments((prev) => [...prev, res.data]); // 썸네일, 원본 경로 저장
      } catch (err) {
        console.error("❌ 이미지 업로드 실패:", err);
        alert(`이미지 업로드 실패: ${file.name}`);
      }
    }
  };

  // 🖼️ Toast UI Editor 내에서 이미지 삽입 시 자동 업로드
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
      console.error("❌ 에디터 이미지 업로드 실패:", err);
      alert("이미지 업로드에 실패했습니다.");
    }
  };

  // 게시글 등록 여요청
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
        attachments,
      });
      alert("게시글이 등록되었습니다.");
      navigate("/boards");
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
        hooks={{
          addImageBlobHook: imageUploadHook,
        }}
      />

      <div className="mt-4 flex justify-end">
        <button onClick={handleSubmit} className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          등록
        </button>
      </div>
    </div>
  );
}
