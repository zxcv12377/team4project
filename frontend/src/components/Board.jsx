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
      .get(`http://localhost:8080/api/board/list?page=${page}`)
      .then((res) => {
        console.log(res.data);
        // setBoards(res.data.dtoList)
      })
      .catch((err) => console.error(err));
  }, [page]);

  return (
<<<<<<< HEAD
    <div className="min-h-[calc(100vh)] flex flex-col items-center justify-center p-6 text-zinc-300">
      <h1 className="text-4xl font-bold mb-6 text-white">게시판</h1>
      <p className="text-lg mb-8">여기는 게시판 기능이 구현될 공간입니다.</p>
      <div className="bg-zinc-700 p-8 rounded-lg shadow-xl w-full max-w-2xl text-center">
        <h2 className="text-2xl font-semibold mb-4 text-blue-400">최신 게시글</h2>
        <ul className="text-left space-y-3">
          <li className="bg-zinc-800 p-3 rounded-md hover:bg-zinc-600 transition-colors cursor-pointer">
            <span className="font-bold text-lg">제목 1:</span> 첫 번째 게시글입니다.
=======
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">게시판 목록</h1>
      <button onClick={() => navigate("/board/write")} className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
        글쓰기
      </button>
      <ul>
        {/* {boards.map((board) => (
          <li key={board.bno} className="border-b py-2">
            <Link to={`/board/${board.bno}`} className="text-blue-600 hover:underline">
              {board.title}
            </Link>
            <div className="text-sm text-gray-500">
              작성자: {board.writer} / 날짜: {board.regDate}
            </div>
>>>>>>> b4e4d5ea99d8d75b248601aa82387517712344a4
          </li>
        ))} */}
      </ul>
      <div className="mt-4 flex gap-2">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
          이전
        </button>
        <button onClick={() => setPage((p) => p + 1)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
          다음
        </button>
      </div>
    </div>
  );
}

function BoardDetail() {
  const { bno } = useParams();
  const [board, setBoard] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`/api/board/${bno}`)
      .then((res) => setBoard(res.data))
      .catch((err) => console.error(err));
  }, [bno]);

  const handleDelete = async () => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      try {
        await axios.delete(`/api/board/${bno}`);
        alert("삭제 완료");
        navigate("/");
      } catch (e) {
        alert("삭제 실패");
      }
    }
  };

  if (!board) return <div>로딩 중...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">{board.title}</h1>
      <div className="mb-4 prose prose-invert" dangerouslySetInnerHTML={{ __html: board.content }}></div>
      <div className="text-sm text-gray-500">
        작성자: {board.writer} / 날짜: {board.regDate}
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={() => navigate(`/board/edit/${bno}`)} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
          수정
        </button>
        <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
          삭제
        </button>
      </div>
    </div>
  );
}

function BoardWrite() {
  const [title, setTitle] = useState("");
  const navigate = useNavigate();
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/board/", {
        title,
        content: editor?.getHTML(),
        writer: "익명",
      });
      alert("등록 완료");
      navigate("/");
    } catch (e) {
      alert("등록 실패");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">글쓰기</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="text" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} className="border p-2 rounded" required />
        <div className="border p-2 rounded bg-white text-black min-h-[200px]">
          <EditorContent editor={editor} />
        </div>
        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
          등록
        </button>
      </form>
    </div>
  );
}

function BoardEdit() {
  const { bno } = useParams();
  const [title, setTitle] = useState("");
  const [initContent, setInitContent] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`/api/board/${bno}`)
      .then((res) => {
        setTitle(res.data.title);
        setInitContent(res.data.content);
      })
      .catch((err) => console.error(err));
  }, [bno]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initContent,
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/board/${bno}`, {
        title,
        content: editor?.getHTML(),
      });
      alert("수정 완료");
      navigate(`/board/${bno}`);
    } catch (e) {
      alert("수정 실패");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">글 수정</h1>
      <form onSubmit={handleUpdate} className="flex flex-col gap-4">
        <input type="text" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} className="border p-2 rounded" required />
        <div className="border p-2 rounded bg-white text-black min-h-[200px]">
          <EditorContent editor={editor} />
        </div>
        <button type="submit" className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600">
          수정
        </button>
      </form>
    </div>
  );
}

export { BoardList, BoardDetail, BoardWrite, BoardEdit };
