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

  // const ws = useWebSocket(token); // ✅ 단일 생성
  // useEffect(() => {
  //   const savedToken = localStorage.getItem("token");
  //   const savedUserRaw = localStorage.getItem("user");

  //   if (savedToken && savedUserRaw) {
  //     try {
  //       const parsedUser = JSON.parse(savedUserRaw);
  //       setToken(savedToken);
  //       setUser(parsedUser);
  //     } catch (err) {
  //       console.error("❌ Failed to parse savedUser:", err);
  //       localStorage.removeItem("token");
  //       localStorage.removeItem("user");
  //     }
  //   }
  //   setIsLoading(false);
  // }, []);

  // const handleLogin = async (token) => {
  //   try {
  //     localStorage.setItem("token", token);
  //     setToken(token);

  //     const res = await axiosInstance.get("/members/me");
  //     const full = { ...res.data, token };
  //     localStorage.setItem("user", JSON.stringify(full));
  //     setUser(full);

  //     window.location.href = "/";
  //   } catch (e) {
  //     console.error("로그인 처리 중 오류", e);
  //   }
  // };

  const handleLogout = () => {
    ws.disconnect(); // ✅ 위에서 생성한 ws 활용
    localStorage.clear();
    setUser(null);
    window.location.href = "/login";
  };

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
