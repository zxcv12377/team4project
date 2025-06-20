import { useState, useEffect } from "react";
import axios from "@/lib/axiosInstance";

export default function FriendDropdown({ userId, userName, x, y, onClose }) {
  const [status, setStatus] = useState("LOADING");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // 상태조회
  useEffect(() => {
    let ignore = false;
    setStatus("LOADING");
    axios
      .get(`/friends/status/${userId}`)
      .then((res) => {
        if (!ignore) setStatus(res.data.status);
      })
      .catch(() => {
        if (!ignore) setStatus("ERROR");
      });
    return () => {
      ignore = true;
    };
  }, [userId]);

  // 친구신청
  const handleAddFriend = async () => {
    setLoading(true);
    setErr(null);
    try {
      await axios.post("/friends", { targetMemberId: userId });
      setStatus("REQUESTED");
    } catch (e) {
      setErr("신청 실패");
    }
    setLoading(false);
  };

  return (
    <div
      className="fixed z-50 bg-neutral-800 text-white rounded shadow-lg py-1 min-w-[140px]"
      style={{ left: x, top: y }}
      tabIndex={0}
      onBlur={onClose}
      autoFocus
    >
      <div className="px-4 py-2 font-bold">{userName}</div>
      {status === "LOADING" && <div className="px-4 py-2">확인중...</div>}
      {status === "ERROR" && <div className="px-4 py-2 text-red-400">상태 확인 오류</div>}
      {status === "NONE" && (
        <button className="w-full text-left px-4 py-2 hover:bg-indigo-600" onClick={handleAddFriend} disabled={loading}>
          {loading ? "신청 중..." : "친구 추가"}
        </button>
      )}
      {status === "REQUESTED" && <div className="px-4 py-2 text-yellow-400 cursor-not-allowed">신청 보냄</div>}
      {status === "ACCEPTED" && <div className="px-4 py-2 text-green-400 cursor-not-allowed">이미 친구임</div>}
      {status === "REJECTED" && <div className="px-4 py-2 text-gray-400 cursor-not-allowed">차단/거절됨</div>}
      {err && <div className="px-4 py-2 text-red-500">{err}</div>}
    </div>
  );
}
