import React, { useState } from "react";
import axios from "axios";
import axiosInstance from "../lib/axiosInstance";
//onImagesUploaded props로 상위 컴포넌트(BoardCreate 등)와 상태를 주고받는 구조  => 재사용

// | 기능
// | -----------------
// | 다중 파일 drag & drop
// | 자동 업로드
// | 썸네일 여러 개 미리보기
// | 같은 파일 다시 선택 가능
// | 토큰 포함 + 서버 요청

export default function ImageUploader({ onImagesUploaded }) {
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  const uploadFiles = async (files) => {
    setUploading(true);
    const uploadedImages = [];
    const previewUrls = [];

    for (const file of files) {
      previewUrls.push(URL.createObjectURL(file));

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await axiosInstance.post("/images/upload", formData);

        uploadedImages.push(res.data); // { originalUrl, thumbnailUrl }
      } catch (error) {
        console.error("업로드 실패:", error);
        alert("이미지 업로드 실패");
      }
    }

    setPreviews((prev) => [...prev, ...previewUrls]);
    onImagesUploaded(uploadedImages); // 부모 컴포넌트에 전달
    setUploading(false);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      uploadFiles(files);
    }
    e.target.value = null; // 같은 파일 다시 선택 가능하게 초기화
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFiles(files);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="w-full p-6 text-center bg-gradient-to-b from-purple-300 to-orange-200 rounded-xl border-2 border-dashed border-gray-400"
    >
      <label
        htmlFor="fileInput"
        className="cursor-pointer inline-block px-4 py-2 bg-white text-sm rounded border shadow mb-2"
      >
        Choose Photo/Video
      </label>
      <input
        id="fileInput"
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      <div className="text-gray-700 text-sm mb-2">or drag & drop images here</div>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {previews.map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt={`미리보기-${idx}`}
              className="w-full h-24 object-cover rounded"
              draggable={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
