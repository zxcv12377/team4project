import React from "react";
import axiosInstance from "../../lib/axiosInstance";

export default function VerryConDeleteButton({ id, onDeleted }) {
  const onClick = async () => {
    if (!id) return;
    if (!confirm("정말 삭제할까요? 되돌릴 수 없습니다.")) return;

    try {
      await axiosInstance.delete(`/verrycons/${id}`);
      alert("삭제 완료");
      onDeleted?.(); // 목록 갱신
    } catch (err) {
      console.error(err);
      alert("삭제 실패");
    }
  };

  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 text-sm">
      삭제
    </button>
  );
}
