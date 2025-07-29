import { useEffect, useState } from "react";
import axiosInstance from "../lib/axiosInstance";
import { useNavigate } from "react-router-dom";

const fmt = (iso) => iso?.replace("T", " ").slice(0, 19) || "";

export default function MyReply() {
  const [replies, setReplies] = useState([]);
  const navigate = useNavigate();

  useEffect(() => loadReplies(), []);

  const loadReplies = () => {
    axiosInstance.get("/replies/my").then((res) => {
      console.log(res.data[0]);
      setReplies(res.data);
    });
  };

  /* 삭제 */
  const handleDelete = async (e, rno) => {
    e.stopPropagation(); // ✅ 상세 이동 막기
    if (!window.confirm("정말로 댓글을 삭제하시겠습니까?")) return;

    try {
      await axiosInstance.delete(`/replies/${rno}`);
      setReplies((prev) => prev.filter((r) => r.rno !== rno));
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-pink-50 rounded-xl border border-pink-200 shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-pink-500 text-center">💬 내가 작성한 댓글</h2>

      {replies.length === 0 ? (
        <p className="text-center text-gray-500">작성한 댓글이 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {replies.map((reply) => (
            <li
              key={reply.rno}
              onClick={() => navigate(`//${reply.bno}`)}
              className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md flex justify-between items-center border border-pink-100 cursor-pointer transition"
            >
              {/* 왼쪽: 댓글 내용·날짜 */}
              <div>
                <p className="text-gray-800 text-sm">{reply.text}</p>
                <div className="text-sm text-gray-500 mt-1">🗓 {fmt(reply.createdDate)}</div>
              </div>

              {/* 오른쪽: 삭제 버튼 */}
              <button
                onClick={(e) => handleDelete(e, reply.rno)}
                className="px-3 py-1 bg-red-400 text-white rounded hover:bg-red-500"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
