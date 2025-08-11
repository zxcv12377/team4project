import React, { useRef } from "react";
import VerryConInlineEditor from "./VerryConInlineEditor";
import VerryConDeleteButton from "./VerryConDeleteButton";

export default function VerryConCard({ item, isEditing, onToggleEdit, onUpdated, onDeleted }) {
  const btnRef = useRef(null);

  return (
    <div className="relative overflow-visible p-3 border rounded-2xl bg-white">
      <img src={item.imagePath} alt={item.categoryName} className="w-full h-32 object-cover rounded-xl border" />
      <div className="text-sm text-gray-700 mt-2">카테고리: {item.categoryName}</div>

      <div className="flex gap-2 mt-2 relative">
        <button
          ref={btnRef}
          className="px-3 py-1.5 rounded-xl bg-gray-800 text-white hover:bg-black text-sm"
          onClick={onToggleEdit}
        >
          수정
        </button>
        <VerryConDeleteButton id={item.id} onDeleted={onDeleted} />

        {isEditing && (
          <VerryConInlineEditor anchorRef={btnRef} con={item} onUpdated={onUpdated} onClose={onToggleEdit} />
        )}
      </div>
    </div>
  );
}
