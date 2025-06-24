import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance"

export default function InviteModal({ open, onClose, room }) {
  const [inviteCode, setInviteCode] = useState("");
  useEffect(() => {
    if (room && open) {
      axiosInstance.get(`/chatrooms/${room.id}/invite-code`)
        .then(res => setInviteCode(res.data.code));
    }
  }, [room, open]);

  if (!open || !room) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 min-w-[320px] flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-lg">친구를 {room.name} 채널로 초대하기</h2>
          <button onClick={onClose} className="text-xl font-bold text-gray-400 hover:text-gray-700">×</button>
        </div>
        <div className="flex gap-2 items-center">
          <span className="font-mono text-lg bg-gray-100 p-2 rounded">{inviteCode}</span>
          <button
            className="px-2 py-1 bg-blue-500 text-white rounded"
            onClick={() => navigator.clipboard.writeText(inviteCode)}
          >복사</button>
        </div>
        <div>
          <input
            className="w-full p-1 bg-gray-100 rounded text-sm"
            value={`${window.location.origin}/invite/${inviteCode}`}
            readOnly
          />
          <button
            className="mt-2 px-2 py-1 bg-blue-500 text-white rounded"
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteCode}`)}
          >초대링크 복사</button>
        </div>
      </div>
    </div>
  );
}