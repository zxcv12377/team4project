import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import ImageUploader from "@/components/ImageUploader";

export default function BoardModify() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState([]); // ✅ 기존 + 새 첨부 이미지
  const { bno } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const getData = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/api/boards/read/${bno}`, { headers });
        const { title, content, attachments } = res.data;
        setTitle(title);
        setContent(content);
        setAttachments(attachments || []); // ✅ 기존 첨부 이미지
      } catch (error) {
        console.error("게시글 정보 가져오기 실패:", error);
        alert("게시글 정보 불러오기 실패");
      }
    };
    getData();

    console.log("🔍 토큰:", token);
    console.log("🔍 headers:", headers);
  }, [bno]);

  // 🔁 새 이미지 업로드
  const handleFileChange = async (e) => {
    const selectedFiles = [...e.target.files];
    const uploadedImages = [];

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await axios.post("http://localhost:8080/api/images/upload", formData, {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
        });
        uploadedImages.push(res.data);
      } catch (err) {
        console.error("이미지 업로드 실패:", err);
        alert("이미지 업로드 실패");
      }
    }

    setAttachments((prev) => [...prev, ...uploadedImages]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    try {
      await axios.put(`http://localhost:8080/api/boards/update/${bno}`, { title, content, attachments }, { headers });
      alert("게시글이 성공적으로 수정되었습니다.");
      navigate(`/boards/${bno}`);
    } catch (error) {
      console.error("게시글 수정 실패:", error);
      alert("게시글 수정 실패");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-24 p-6 rounded-lg">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">📝 게시글 수정</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-700 font-medium">제목</label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 font-medium">내용</label>
          <textarea
            className="w-full h-40 px-4 py-2 border rounded-lg resize-none focus:outline-none focus:ring focus:ring-blue-200"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 font-medium">이미지 추가</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600"
          />

          {attachments.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {attachments.map((img, idx) => {
                let src = "";
                if (typeof img === "string") {
                  src = img;
                } else {
                  src = img.thumbnailUrl || img.originalUrl || "";
                }
                const finalSrc = src.startsWith("http") ? src : `http://localhost:8080${src}`;
                return (
                  <img
                    key={idx}
                    src={finalSrc}
                    alt={`첨부 이미지 ${idx + 1}`}
                    className="w-full h-24 object-cover rounded"
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            취소
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            수정 완료
          </button>
        </div>
      </form>
    </div>
  );
}
