import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function BoardList() {
  const [boards, setBoards] = useState([]);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  // JWT 토큰에서 userId를 추출
  const getUserIdFromToken = () => {
    const token = localStorage.getItem("token");

    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch (e) {
      console.error("토큰 파싱 실패", e);
      return null;
    }
  };
  const currentUserId = getUserIdFromToken();

  useEffect(() => {
    axios
      .get(`/api/boards/list?page=${page}`)
      .then((res) => {
        console.log(res.data.dtoList);
        setBoards(res.data.dtoList || []);
      })
      .catch((err) => console.error("게시글 목록 로딩 실패", err));
  }, [page]);

  const handleDelete = async (bno) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await axios.delete(`/api/boards/delete/${bno}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      alert("삭제 완료");
      setBoards((prev) => prev.filter((board) => board.bno !== bno));
    } catch (error) {
      console.error(error);
      alert("삭제 실패");
    }
  };
  console.log(
    "토큰에서 꺼낸 ID:",
    getUserIdFromToken(),
    typeof getUserIdFromToken()
  );

  if (!boards) return <div>로딩 중...</div>;

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4 text-red-500">게시판 목록</h1>

      <ul className="space-y-4">
        {boards.length === 0 ? (
          <p className="text-gray-400">게시글이 없습니다.</p>
        ) : (
          boards.map((board) => {
            const isMyBoard =
              currentUserId && Number(currentUserId) === Number(board.memberId);

            return (
              <li
                key={board.bno}
                className="p-4 bg-[#1e293b] rounded shadow flex justify-between items-center"
              >
                <div
                  className="cursor-pointer flex-grow"
                  onClick={() => navigate(`/board/${board.bno}`)}
                >
                  <h3 className="text-lg font-semibold">{board.title}</h3>
                  <p className="text-sm text-gray-400">
                    작성자: {board.nickname} · 댓글: {board.replyCount}
                  </p>
                </div>

                {isMyBoard && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(board.bno);
                    }}
                    className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    삭제
                  </button>
                )}
              </li>
            );
          })
        )}
      </ul>

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
        >
          이전
        </button>
        <button
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
        >
          다음
        </button>
        <button
          onClick={() => navigate("/board/write")}
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          글쓰기
        </button>
      </div>
    </div>
  );
}

export { BoardList };
