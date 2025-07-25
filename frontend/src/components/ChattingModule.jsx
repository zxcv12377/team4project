import RootLayout from "../layoutscopy/RootLayout";
import Layout from "../layoutscopy/Layout";
import { Outlet } from "react-router-dom";
import { RealtimeProvider } from "../context/RealtimeContext";
import { UserContext, useUserContext } from "../context/UserContext";

import { useWebSocket } from "../hooks/useWebSocket";

function ChattingModule() {
  // const [token, setToken] = useState(null);
  // const [user, setUser] = useState(null);
  // const [isLoading, setIsLoading] = useState(true);
  const { user, setUser } = useUserContext();
  const token = user?.token;
  const ws = useWebSocket(token);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="bg-[#313338] text-white min-h-screen">
      {/* ✅ 반드시 WebSocketContext에서 꺼낸 ws로 RealtimeProvider 감싸기 */}
      <RealtimeProvider socket={ws}>
        <RootLayout>
          <Outlet /> // ⭐ 이 자리에서 위에서 만든 /chatting/* 하위 Routes 가 뜸
        </RootLayout>
      </RealtimeProvider>
    </div>
  );
}

export default ChattingModule;
