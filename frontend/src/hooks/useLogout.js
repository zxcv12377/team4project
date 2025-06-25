import { useNavigate } from "react-router-dom";
import axiosInstance from "@/lib/axiosInstance";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/context/WebSocketContext"; //  WebSocketContext에서 공유된 인스턴스 사용

export const useLogout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { disconnect } = useSocket(); //  진짜 연결된 WebSocket 인스턴스에서 disconnect 가져옴

  return async () => {
    try {
      await axiosInstance.post("/member/logout");

      disconnect?.(); //  WebSocket 종료 → 서버에서 markOffline() → Redis 정리

      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("username");
      localStorage.removeItem("name");

      toast({
        title: "로그아웃 완료",
        description: "정상적으로 로그아웃되었습니다.",
      });

      navigate("/login");
    } catch (error) {
      console.error("🚫 로그아웃 실패:", error);
      toast({
        title: "로그아웃 실패",
        description: "서버 요청 중 문제가 발생했습니다.",
        variant: "destructive",
      });
    }
  };
};
