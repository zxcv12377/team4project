import { useNavigate } from "react-router-dom";
import axiosInstance from "@/lib/axiosInstance";
import { useSocket } from "@/context/WebSocketContext"; //  WebSocketContext에서 공유된 인스턴스 사용

export const useLogout = () => {
  const navigate = useNavigate();
  const { disconnect } = useSocket(); //  진짜 연결된 WebSocket 인스턴스에서 disconnect 가져옴

  return async () => {
    try {
      await axiosInstance.post("/member/logout");

      disconnect?.(); //  WebSocket 종료 → 서버에서 markOffline() → Redis 정리

      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("username");
      localStorage.removeItem("name");

      alert("로그아웃 되었습니다.");

      navigate("/login");
    } catch (error) {
      console.error("🚫 로그아웃 실패:", error);
      alert("로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };
};
