import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from '@/lib/axiosInstance';
import { useToast } from "@/hooks/use-toast";
import { useUserContext } from "@/context/UserContext";

export default function InviteJoinPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUserContext();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // 1. 초대코드 정보 불러오기
  useEffect(() => {
    axiosInstance.get(`/invites/${code}`)
      .then(res => {
        setInvite(res.data);
      })
      .catch(err => {
        toast.error("유효하지 않거나 만료된 초대코드입니다.");
        navigate("/"); // 홈으로 리디렉션
      })
      .finally(() => {
        setLoading(false);
      });
  }, [code]);

  // 2. 참여 처리
  const handleJoin = () => {
  setJoining(true);
  axiosInstance.post(`/invites/${code}/join`)  
    .then(res => {
      toast({
  title: "채널에 참여했습니다!",
  variant: "success",
});
      navigate(`/servers/${res.data.roomId}`); 
    })
    .catch(err => {
      toast({
  title: "참여 실패",
  description: err?.response?.data || "채널 참여 중 오류 발생",
  variant: "error", // ❗️핵심: variant를 "error"로 지정
});
      setJoining(false);
    });
};

  // 3. 로딩 중
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#1e1f22] text-white">
      초대 정보를 불러오는 중...
    </div>
  );

  // 4. 렌더링
  return (
    <div className="flex items-center justify-center h-screen bg-[#1e1f22] text-white">
      <div className="bg-[#2b2d31] p-6 rounded-xl shadow-lg w-[400px] flex flex-col gap-4">
        <div className="text-xl font-bold text-center">📩 채널 초대</div>

        <div className="bg-zinc-800 px-4 py-3 rounded">
          <div className="text-sm text-zinc-400 mb-1">채널 이름</div>
          <div className="text-lg font-semibold">{invite.roomName}</div>
        </div>

        <div className="bg-zinc-800 px-4 py-3 rounded">
          <div className="text-sm text-zinc-400 mb-1">설명</div>
          <div className="text-sm">{invite.roomDescription || "없음"}</div>
        </div>

        <div className="bg-zinc-800 px-4 py-3 rounded">
          <div className="text-sm text-zinc-400 mb-1">초대자</div>
          <div className="text-sm">{invite.creatorName}</div>
        </div>

        <button
          onClick={handleJoin}
          disabled={joining}
          className={`bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-center font-bold ${joining && "opacity-50"}`}
        >
          {joining ? "참여 중..." : "참여하기"}
        </button>
      </div>
    </div>
  );
}
