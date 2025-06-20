import ChatRoom from "@/components/room/ChatRoom";
import { useContext } from "react";
import { UserContext } from "@/context/UserContext";
import FriendPanel from "@/components/room/FriendPanel";
import { WebSocketContext } from "../context/WebSocketContext";

export default function Sidebar3({ dmMode, serverId, roomId, friendMode, currentUser }) {
  const token = localStorage.getItem("token");
  const { name } = useContext(UserContext);
  const { connected, subscribe, send } = useContext(WebSocketContext);

  if (dmMode && friendMode) {
    return <FriendPanel />;
  }

  if (!roomId) {
    return (
      <div className="flex-1 bg-[#313338] flex items-center justify-center text-zinc-500 text-lg">
        채팅방을 선택하세요
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#313338] h-full">
      <ChatRoom
        roomId={roomId}
        // token={token}
        token={localStorage.getItem("token")}
        connected={connected}
        currentUser={{ name: currentUser?.name || "알 수 없음" }}
        subscribe={subscribe}
        send={send}
      />
    </div>
  );
}
