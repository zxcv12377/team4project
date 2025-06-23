import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

function BoardEdit() {
  const { bno } = useParams(); // 게시글 번호 추출
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    // 게시글 데이터 불러오기
    axios
      .get(`http://localhost:8080/api/boards/read/${bno}`)
      .then((res) => {
        setTitle(res.data.title);
        setContent(res.data.content);
      })
      .catch((err) => {
        alert("게시글을 불러오지 못했습니다.");
        console.error(err);
      });
  }, [bno]);

  const handleUpdate = async () => {
    try {
      await axios.put(
        `http://localhost:8080/api/boards/update/${bno}`,
        {
          title,
          content,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("수정이 완료되었습니다.");
      navigate(`/board/read/${bno}`);
    } catch (err) {
      console.error(err);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold">게시글 수정</h2>
      <input
        className="w-full border p-2 rounded"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="w-full border p-2 rounded h-40"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button
        onClick={handleUpdate}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        수정하기
      </button>
    </div>
  );
}

export default BoardEdit;
