import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { useToast } from "@/hooks/use-toast";

export default function InviteModal({ open, onClose, room, serverId }) {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;

    setLoading(true);

    const fetchCode = room
      ? axiosInstance.get(`/chatrooms/${room.id}/invite-code`)
      : axiosInstance.post(`/invites`, {
          serverId,
          expireAt: null,
          maxUses: null,
          memo: "",
        });

    fetchCode
      .then((res) => setInviteCode(res.data.code || res.data.inviteCode))
      .catch(() => {
        toast.error("초대코드 불러오기 실패");
        setInviteCode("에러");
      })
      .finally(() => setLoading(false));
  }, [open, room, serverId]);

  if (!open) return null;

  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
  const inviteLink = `${baseUrl}/invite/${inviteCode}`;
  const title = room
    ? `친구를 ${room.name} 채널로 초대하기`
    : "서버에 친구를 초대하기";

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 min-w-[320px] flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="text-xl font-bold text-gray-400 hover:text-gray-700">×</button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">초대코드 불러오는 중...</div>
        ) : (
          <>
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
                value={inviteLink}
                readOnly
              />
              <button
                className="mt-2 px-2 py-1 bg-blue-500 text-white rounded"
                onClick={() => navigator.clipboard.writeText(inviteLink)}
              >초대링크 복사</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
