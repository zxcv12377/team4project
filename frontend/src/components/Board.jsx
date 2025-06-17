import React from "react";

/**
 * 게시판 페이지를 나타내는 컴포넌트입니다.
 * 실제 게시판 목록, 게시글 작성, 조회 등의 기능이 여기에 구현될 수 있습니다.
 */
function BoardPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#313338] text-zinc-300">
      <h1 className="text-4xl font-bold mb-6 text-white">게시판</h1>
      <p className="text-lg mb-8">여기는 게시판 기능이 구현될 공간입니다.</p>
      <div className="bg-zinc-700 p-8 rounded-lg shadow-xl w-full max-w-2xl text-center">
        <h2 className="text-2xl font-semibold mb-4 text-blue-400">최신 게시글</h2>
        <ul className="text-left space-y-3">
          <li className="bg-zinc-800 p-3 rounded-md hover:bg-zinc-600 transition-colors cursor-pointer">
            <span className="font-bold text-lg">제목 1:</span> 첫 번째 게시글입니다.
          </li>
          <li className="bg-zinc-800 p-3 rounded-md hover:bg-zinc-600 transition-colors cursor-pointer">
            <span className="font-bold text-lg">제목 2:</span> 공지사항을 확인해주세요.
          </li>
          <li className="bg-zinc-800 p-3 rounded-md hover:bg-zinc-600 transition-colors cursor-pointer">
            <span className="font-bold text-lg">제목 3:</span> 자유롭게 글을 작성해보세요!
          </li>
        </ul>
        <button className="mt-8 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-md">
          게시글 작성
        </button>
      </div>
      <p className="mt-8 text-zinc-500 text-sm">채널 또는 DM 선택 시 ChatRoom 컴포넌트가 대신 표시됩니다.</p>
    </div>
  );
}

export default BoardPage;
