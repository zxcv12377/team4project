import React, { useEffect, useRef, useState } from "react";
import axiosInstance from "../../lib/axiosInstance";

export default function VerryConEditForm({ con, onUpdated, onCancel }) {
  const [categoryName, setCategoryName] = useState(con?.categoryName || "");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(con?.imagePath || "");
  const inputRef = useRef();

  useEffect(() => {
    setCategoryName(con?.categoryName || "");
    setPreviewUrl(con?.imagePath || "");
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [con?.id]);

  const onChangeFile = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    if (f) setPreviewUrl(URL.createObjectURL(f));
    else setPreviewUrl(con?.imagePath || "");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!con?.id) return;

    const form = new FormData();
    if (categoryName && categoryName !== con.categoryName) {
      form.append("categoryName", categoryName);
    }
    if (file) form.append("file", file);

    try {
      await axiosInstance.put(`/verrycons/${con.id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("수정 완료!");
      onUpdated?.();
    } catch (err) {
      console.error(err);
      alert("수정 실패");
    }
  };

  const resetFile = () => {
    setFile(null);
    setPreviewUrl(con?.imagePath || "");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h3 className="text-base font-semibold">베리콘 수정</h3>

      <div className="flex items-center gap-3">
        <img src={previewUrl} alt="preview" className="w-20 h-20 object-cover rounded-xl border" />
        <div className="flex flex-col gap-1">
          <input ref={inputRef} type="file" accept="image/*" onChange={onChangeFile} className="block text-xs" />
          {file && (
            <button type="button" onClick={resetFile} className="text-xs underline text-gray-600 self-start">
              파일 취소
            </button>
          )}
          <p className="text-[11px] text-gray-500">
            GIF는 200×200 이하만 업로드 가능. JPG/PNG는 200px로 자동 리사이즈 저장됨.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-700 mb-1">카테고리 이름</label>
        <input
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          placeholder="예: 웃음"
          className="w-full rounded-xl border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-2">
        <button type="submit" className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm">
          저장
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-xl border text-sm">
          취소
        </button>
      </div>
    </form>
  );
}
