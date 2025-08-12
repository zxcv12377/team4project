
import { useEffect } from "react";
import { useRealtime } from "../context/RealtimeContext";
import clsx from "clsx";

export default function Sidebar4({ serverId, selectedMemberId, onSelectMember }) {
  const { state, fetchAndSetServerMembers } = useRealtime();
  const rawMembers = state.serverMembers?.[serverId];
  const members = Array.isArray(rawMembers) ? rawMembers.filter((m) => m && typeof m === "object") : [];

  const loading = state.loadingServerMember?.has(serverId);

  useEffect(() => {
    if (!serverId) return;
    fetchAndSetServerMembers(serverId);
  }, [serverId]);

  if (!serverId) return null;
  console.log("🧪 rawMembers:", rawMembers);
  return (
    <div className="w-[300px] min-w-[260px] max-w-[260px] bg-[#232428] border-l border-[#232428] flex flex-col h-full">
      <div className="font-bold text-base px-5 py-4 border-b border-[#232428]">참여자</div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-zinc-400">로딩중...</div>
      ) : members.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500">참여자가 없습니다</div>
      ) : (
        <ul className="flex-1 overflow-y-auto px-3 py-2">
          {members.map((m, idx) => {
            const id = m?.memberId || m?.id || idx;
            const name = m?.name ?? "이름 없음";
            const role = m?.role ?? "역할 없음";

            return (
              <li
                key={id}
                className={clsx(
                  "flex flex-col gap-1 px-2 py-2 rounded hover:bg-zinc-800 cursor-pointer",
                  selectedMemberId === id && "bg-zinc-800 font-semibold"
                )}
                onClick={() => onSelectMember?.(m)}
              >
                <div className="text-sm">{name}</div>
                <div className="text-xs text-zinc-400">{role}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
