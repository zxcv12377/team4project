import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

function BoardList() {
  const [boards, setBoards] = useState([]);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`api/board/list?page=${page}`)
      .then((res) => {
        console.log(res.data);
        // setBoards(res.data.dtoList)
      })
      .catch((err) => console.error(err));
  }, [page]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">게시판 목록</h1>
      <button
        onClick={() => navigate("/board/write")}
        className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        글쓰기
      </button>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          이전
        </button>
        <button onClick={() => setPage((p) => p + 1)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
          다음
        </button>
      </div>
    </div>
  );
}

export { BoardList };
