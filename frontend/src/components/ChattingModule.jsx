import RootLayout from "../layoutscopy/RootLayout";
import Layout from "../layoutscopy/Layout";
import { Outlet } from "react-router-dom";
import { RealtimeProvider } from "../context/RealtimeContext";
import { UserContext, useUserContext } from "../context/UserContext";
import { useContext, useEffect } from "react";
import { WebSocketContext } from "../context/WebSocketContext";

function ChattingModule() {
  // const [token, setToken] = useState(null);
  // const [user, setUser] = useState(null);
  // const [isLoading, setIsLoading] = useState(true);
  const { user, setUser } = useUserContext();
  const token = user?.token;
  const ws = useContext(WebSocketContext);

  useEffect(() => {
    document.body.classList.remove("with-navbar");
    return () => {
      // 화면 떠날 때는 원복은 굳이 안 해도 Navbar가 다시 붙여줌
      // document.body.classList.add("with-navbar");
    };
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="bg-[#313338] text-white min-h-screen">
      {/* ✅ 반드시 WebSocketContext에서 꺼낸 ws로 RealtimeProvider 감싸기 */}
      <Outlet /> // ⭐ 이 자리에서 위에서 만든 /chatting/* 하위 Routes 가 뜸
    </div>
  );
}

export default ChattingModule;
