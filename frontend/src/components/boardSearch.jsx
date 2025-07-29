// src/pages/BoardSearch.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axiosInstance from "../lib/axiosInstance";

export default function BoardSearch() {
  const { search } = useLocation(); // "?type=tc&keyword=foo&page=1"
  const params = new URLSearchParams(search);
  const type = params.get("type");
  const keyword = params.get("keyword");
  const page = params.get("page") || 1;

  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    axiosInstance
      .get(`/boards/list?type=${type}&keyword=${keyword}&page=${page}&size=10`)
      .then((res) => {
        setResults(res.data.dtoList);
        setTotal(res.data.totalCount);
      })
      .catch(console.error);
  }, [type, keyword, page]);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold">🔍 검색: “{keyword}”</h1>
      {results.length === 0 ? (
        <p>검색 결과가 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {results.map((b) => (
            <li key={b.bno} onClick={() => /* 상세로 이동 */ {}}>
              [{b.bno}] {b.title}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4">총 {total}건</p>
    </div>
  );
}
