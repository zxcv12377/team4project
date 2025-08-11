import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../lib/axiosInstance";
import VerryConCard from "./VerryConCard";
import { useNavigate } from "react-router-dom";

export default function VerryConManager() {
  const [items, setItems] = useState([]); // [{id, imagePath, categoryName}]
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null); // ✅ 인라인 폼 대상 id
  const navigate = useNavigate();

  const fetchList = async () => {
    try {
      const url = categoryFilter ? `/verrycons?category=${encodeURIComponent(categoryFilter)}` : `/verrycons`;
      const { data } = await axiosInstance.get(url);
      setItems(data || []);
    } catch (err) {
      console.error(err);
      alert("목록을 불러오지 못했습니다.");
    }
  };

  const fetchCategories = async () => {
    const { data } = await axiosInstance.get(`/verrycons`);
    const set = new Set((data || []).map((d) => d.categoryName));
    setCategories(Array.from(set));
  };

  useEffect(() => {
    fetchList();
  }, [categoryFilter]);
  useEffect(() => {
    fetchCategories();
  }, []);

  const onUpdated = () => {
    setEditingId(null);
    fetchList();
    fetchCategories();
  };
  const onDeleted = () => {
    if (editingId) setEditingId(null);
    fetchList();
    fetchCategories();
  };

  const displayItems = useMemo(() => items, [items]);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex gap-2 items-center mb-4">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border px-3 py-2"
        >
          <option value="">전체</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button className="px-3 py-2 rounded-xl border" onClick={() => setCategoryFilter("")}>
          필터 초기화
        </button>
        <button
          className="px-3 py-2 rounded-xl border bg-slate-400"
          onClick={() => navigate("/admin/verrycon/uploads")}
        >
          베리콘 등록
        </button>
      </div>

      {/* 오버레이가 잘리지 않도록 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-visible">
        {displayItems.map((it) => (
          <VerryConCard
            key={it.id}
            item={it}
            isEditing={editingId === it.id}
            onToggleEdit={() => setEditingId(editingId === it.id ? null : it.id)}
            onUpdated={onUpdated}
            onDeleted={onDeleted}
          />
        ))}
      </div>
    </div>
  );
}
