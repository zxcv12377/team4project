import { useEffect, useState } from "react";
import axios from "@/lib/axiosInstance"; // 프로젝트 axios 래퍼 쓰는 경우

export default function Sidebar4({ serverId, selectedMemberId, onSelectMember, speakingUsers = [], roomId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   if (!roomId) return;
  //   axios
  //     .get(`/voice-rooms/${roomId}/participants`)
  //     .then((res) => setMembers(res.data || []))
  //     .catch(() => setMembers([]));
  // }, [roomId]);

  useEffect(() => {
    if (!serverId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    axios
      .get(`/servers/${serverId}/api/members`)
      .then((res) => setMembers(res.data || []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [serverId]);

  if (!serverId) return null;

  return (
    <div className="w-[220px] min-w-[180px] max-w-[260px] bg-[#232428] border-l border-[#232428] flex flex-col h-full">
      <div className="font-bold text-base px-5 py-4 border-b border-[#232428]">참여자</div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-zinc-400">로딩중...</div>
      ) : members.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500">참여자가 없습니다</div>
      ) : (
        <ul className="flex-1 overflow-y-auto px-3 py-2">
          {members.map((m) => {
            const isSpeaking = speakingUsers.some((u) => u.memberId === m.memberId || u.memberId === m.id);
            return (
              <li
                key={m.memberId || m.id}
                className={`flex items-center gap-2 px-2 py-2 rounded hover:bg-zinc-800 cursor-pointer ${
                  selectedMemberId === (m.memberId || m.id) ? "bg-zinc-800 font-semibold" : ""
                }`}
                onClick={() => onSelectMember && onSelectMember(m)}
              >
                <div className="relative">
                  <img
                    src={m.profile || "/default-profile.png"}
                    alt="profile"
                    className="w-9 h-9 rounded-full object-cover border border-zinc-700"
                  />
                  {isSpeaking && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-[#232428] animate-ping"></div>
                  )}
                </div>
                <div>
                  <div className="text-sm">{m.name}</div>
                  <div className="text-xs text-zinc-400">{m.role}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
