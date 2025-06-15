import ChatRoom from "@/components/room/ChatRoom";
import { useContext } from "react";
import { UserContext } from "@/context/UserContext";

export default function Sidebar3({ dmMode, serverId, roomId }) {
  const token = localStorage.getItem("token");
  const { name } = useContext(UserContext);

  if (!roomId) {
    return (
      <div className="flex-1 bg-[#313338] flex items-center justify-center text-zinc-500 text-lg">
        채팅방을 선택하세요
      </div>
    );
  }
  return (
    <div className="flex-1 bg-[#313338] h-full">
      <ChatRoom roomId={roomId} token={token} currentUser={{ name }} />
    </div>
  );
}