// src/components/layout/Sidebar1.jsx
import { useEffect, useState } from "react";
import axiosInstance from "../lib/axiosInstance";

export default function Sidebar1({ onSelectDM, onSelectServer }) {
  const [servers, setServers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [serverName, setServerName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const fetchServers = () => axiosInstance.get("/servers").then((res) => setServers(res.data));

  useEffect(() => {
    fetchServers();
  }, []);

  // 서버 개설
  const handleCreate = async () => {
    if (!serverName.trim()) return;
    await axiosInstance.post("/servers", { name: serverName });
    setServerName("");
    setShowCreate(false);
    fetchServers();
  };

  // 서버 참여
  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    await axiosInstance.post("/servers/join", { code: joinCode });
    setJoinCode("");
    setShowJoin(false);
    fetchServers();
  };

  // 서버 탈퇴/삭제
  const handleLeave = async (id) => {
    if (!window.confirm("정말 탈퇴/삭제하시겠습니까?")) return;
    await axiosInstance.delete(`/servers/${id}`);
    fetchServers();
  };

  return (
    <div className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 gap-3 border-r border-[#232428] h-full">
      {/* DM 아이콘 */}
      <button
        className="w-12 h-12 rounded-[24px] bg-[#5865f2] flex items-center justify-center text-white font-bold text-2xl mb-1 transition-all duration-150 hover:rounded-2xl hover:bg-[#4752c4]"
        onClick={onSelectDM}
        title="DM"
      >
        💬
      </button>
      {/* 구분선 */}
      <div className="h-[2px] w-8 bg-[#232428] my-2 rounded-full" />
      {/* 서버 목록 */}
      {servers.map((server) => (
        <div key={server.id} className="flex flex-col items-center group">
          <button
            className="w-12 h-12 rounded-[24px] bg-[#313338] text-white font-bold text-xl transition-all duration-150 hover:bg-[#5865f2] hover:rounded-2xl focus:bg-[#5865f2]"
            onClick={() => onSelectServer(server.id)}
            title={server.name}
          >
            {server.name[0] || "?"}
          </button>
          <button
            onClick={() => handleLeave(server.id)}
            className="opacity-0 group-hover:opacity-100 mt-1 text-xs text-red-400 transition"
            title="탈퇴/삭제"
          >
            ⛔
          </button>
        </div>
      ))}
      {/* 서버 추가/참여 버튼 */}
      <button
        onClick={() => setShowCreate(true)}
        className="w-10 h-10 mt-3 rounded-full bg-[#313338] text-[#3ba55d] font-bold text-xl hover:bg-[#3ba55d] hover:text-white transition"
        title="서버 개설"
      >
        +
      </button>
      <button
        onClick={() => setShowJoin(true)}
        className="w-10 h-10 mt-1 rounded-full bg-[#313338] text-[#f23f43] text-lg hover:bg-[#f23f43] hover:text-white transition"
        title="서버 참여"
      >
        ⤵️
      </button>
      {/* 서버 개설 모달 */}
      {showCreate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-zinc-900 p-6 rounded shadow flex flex-col gap-2">
            <div className="font-bold text-white mb-2">서버 개설</div>
            <input
              type="text"
              className="p-2 rounded w-56 text-black"
              placeholder="서버 이름"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="px-3 py-1 bg-blue-600 text-white rounded">
                확인
              </button>
              <button onClick={() => setShowCreate(false)} className="px-3 py-1 bg-zinc-700 text-white rounded">
                취소
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 서버 참여 모달 */}
      {showJoin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-zinc-900 p-6 rounded shadow flex flex-col gap-2">
            <div className="font-bold text-white mb-2">서버 참여</div>
            <input
              type="text"
              className="p-2 rounded w-56"
              placeholder="참여코드"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={handleJoin} className="px-3 py-1 bg-blue-600 text-white rounded">
                참여
              </button>
              <button onClick={() => setShowJoin(false)} className="px-3 py-1 bg-zinc-700 text-white rounded">
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
