import React from "react";
import axiosInstance from "../lib/axiosInstance";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export default function ImageUploader({ onImagesUploaded, disabled }) {
  // 이미지 선택 or 드롭 시 호출
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    const uploadedImages = [];
    const failedFiles = [];

    for (const file of files) {
      // 유효성 검사
      if (!ACCEPTED_TYPES.includes(file.type)) {
        failedFiles.push(`${file.name} (지원하지 않는 형식)`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        failedFiles.push(`${file.name} (3MB 초과)`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await axiosInstance.post("/images/upload", formData);
        const { originalUrl, thumbnailUrl } = res.data;

        // 상대경로인 경우 baseURL 붙이기
        const baseImageUrl = import.meta.env.VITE_IMAGE_BASE_URL; // http://localhost:8080
        const fixedOriginal = originalUrl.startsWith("http") ? originalUrl : `${baseImageUrl}${originalUrl}`;
        const fixedThumbnail = thumbnailUrl?.startsWith("http") ? thumbnailUrl : `${baseImageUrl}${thumbnailUrl}`;

        uploadedImages.push({
          originalUrl: fixedOriginal,
          thumbnailUrl: fixedThumbnail,
        });
      } catch (err) {
        console.error(`❌ "${file.name}" 업로드 실패:`, err);
        failedFiles.push(`${file.name} (서버 오류)`);
      }
    }

    // 부모 컴포넌트에 전달
    if (uploadedImages.length > 0) {
      onImagesUploaded(uploadedImages);
    }

    if (failedFiles.length > 0) {
      alert(`❌ 다음 파일 업로드에 실패했습니다:\n\n${failedFiles.join("\n")}`);
    }

    // 같은 파일 다시 선택 가능하게 초기화
    e.target.value = null;
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        id="image-upload"
        onChange={handleUpload}
        disabled={disabled}
      />
      <label
        htmlFor="image-upload"
        className={`inline-block px-4 py-2 text-sm rounded border shadow cursor-pointer bg-white text-gray-800 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        📷 이미지 업로드
      </label>
    </>
  );
}
