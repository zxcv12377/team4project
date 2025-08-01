import { useState, useEffect } from "react";
import axiosInstance from '@/lib/axiosInstance';
import { useUserContext } from "@/context/UserContext";
import { useRealtime } from "@/context/RealtimeContext";

export default function FriendDropdown({ userId, userName, x, y, onClose, onSelectDMRoom }) {
  const [status, setStatus] = useState("LOADING");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const { user } = useUserContext();
  const myId = user?.id;
  const { refreshDmRooms } = useRealtime();

  // 친구 상태 조회
  useEffect(() => {
    let ignore = false;
    setStatus("LOADING");
    axiosInstance.get(`/friends/status/${userId}`)
      .then(res => {
        if (!ignore) setStatus(res.data.status);
      })
      .catch(() => {
        if (!ignore) setStatus("ERROR");
      });
    return () => { ignore = true; };
  }, [userId]);

  // 친구 추가 핸들러
  const handleAddFriend = async () => {
    setLoading(true);
    setErr(null);
    try {
      await axiosInstance.post("/friends", { targetMemberId: userId });
      setStatus("REQUESTED");
    } catch (e) {
      setErr("신청 실패");
    }
    setLoading(false);
  };

  // 1:1 DM 생성 핸들러
  const handleStartDM = async () => {
    if (!myId) {
      console.error("❌ 내 userId (myId)가 null입니다. UserContext 확인 필요");
      return;
    }

    try {
      const res = await axiosInstance.post("/dm/room", {
        myId: myId,
        friendId: userId,
      });
      console.log("DM 요청 → 내 ID:", myId, "상대 ID:", userId);
      const roomId = res.data.id;
      refreshDmRooms?.();

      if (onSelectDMRoom) onSelectDMRoom(roomId);
      onClose();
    } catch (err) {
      console.error("❌ DM 생성 실패", err);
    }
  };

  // 상태별 아이콘과 색상
  const getStatusInfo = () => {
    switch (status) {
      case "LOADING":
        return { icon: "⏳", text: "확인중...", color: "text-[#b9bbbe]" };
      case "ERROR":
        return { icon: "❌", text: "상태 확인 오류", color: "text-[#f23f43]" };
      case "NONE":
        return { icon: "👤", text: "친구 추가", color: "text-[#b9bbbe]" };
      case "REQUESTED":
        return { icon: "📤", text: "신청 보냄", color: "text-[#faa61a]" };
      case "ACCEPTED":
        return { icon: "✅", text: "이미 친구임", color: "text-[#3ba55d]" };
      case "REJECTED":
        return { icon: "🚫", text: "차단/거절됨", color: "text-[#72767d]" };
      default:
        return { icon: "❓", text: "알 수 없음", color: "text-[#72767d]" };
    }
  };

  const statusInfo = getStatusInfo();

 return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div id="menu" className="fixed z-50 open" style={{ left: x, top: y }}>
        {/* ✨ 효과 요소 */}
        <span className="glow"></span>
        <span className="glow glow-bottom glow-bright"></span>
        <span className="shine"></span>
        <span className="shine shine-bottom"></span>

        <div className="inner">
          <section>
            <header>
              <div className="flex items-center gap-2 px-1 py-2">
                <div className="w-8 h-8 bg-[#5865f2] rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-sm">
                  <span className="font-semibold text-[#f2f3f5]">{userName}</span>
                  <span className="text-xs text-[#b9bbbe]">사용자</span>
                </div>
              </div>
            </header>

            <ul>
              {/* 메시지 */}
              <li onClick={handleStartDM}>
                <span className="text-base">💬</span>
                <span className="font-medium">메시지 보내기</span>
              </li>

              {/* 친구 추가 */}
              {status === "NONE" && (
                <li onClick={handleAddFriend} className={loading ? "opacity-50 cursor-not-allowed" : ""}>
                  <span className="text-base">👤</span>
                  <span className="font-medium">
                    {loading ? "신청 중..." : "친구 추가"}
                  </span>
                  {loading && (
                    <div className="ml-auto">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                </li>
              )}

              {/* 친구 상태 */}
              {status !== "NONE" && status !== "LOADING" && (
                <li className={`${statusInfo.color} cursor-default`}>
                  <span className="text-base">{statusInfo.icon}</span>
                  <span className="font-medium">{statusInfo.text}</span>
                </li>
              )}

              {/* 로딩 상태 */}
              {status === "LOADING" && (
                <li className="text-[#b9bbbe] cursor-default">
                  <div className="w-4 h-4 border-2 border-[#b9bbbe]/30 border-t-[#b9bbbe] rounded-full animate-spin"></div>
                  <span className="font-medium">상태 확인 중...</span>
                </li>
              )}

              <hr />

              {/* ID 복사 */}
              <li onClick={() => {
                navigator.clipboard.writeText(`사용자 ID: ${userId}`);
                onClose();
              }}>
                <span className="text-base">📋</span>
                <span className="font-medium">ID 복사</span>
              </li>

              {/* 신고 */}
              <li className="text-[#f23f43]" onClick={() => {
                console.log("신고 기능");
                onClose();
              }}>
                <span className="text-base">⚠️</span>
                <span className="font-medium">신고</span>
              </li>
            </ul>
          </section>

          {/* 에러 메시지 */}
          {err && (
            <div className="px-3 py-2 bg-[#f23f43]/10 border-t border-[#f23f43]/20">
              <div className="flex items-center gap-2 text-[#f23f43] text-sm">
                <span>❌</span>
                <span>{err}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}