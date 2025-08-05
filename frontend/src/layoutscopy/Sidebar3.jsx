import ChatRoom from "@/components/room/ChatRoom";
import { useContext } from "react";
import { UserContext } from "@/context/UserContext";
import FriendPanel from "@/components/room/FriendPanel";
import { useRealtime } from "@/context/RealtimeContext";
import { WebSocketContext } from "@/context/WebSocketContext";

export default function Sidebar3({ dmMode, serverId, roomId, friendMode, currentUser }) {
  const token = localStorage.getItem("token");
  const { user } = useContext(UserContext);
  const { state } = useRealtime();
  const { connected, subscribe, send } = useContext(WebSocketContext);

  if (!state) {
    return null; // state가 아직 초기화 안 된 경우 방어
  }

  if (dmMode && friendMode) {
    return <FriendPanel />;
  }

  let currentRoom = null;

  if (dmMode) {
    const dmRooms = state.dmRooms ?? [];
    currentRoom = dmRooms.find(room => room.id === roomId);
    
  if (!roomId || !currentRoom?.visible) {
    return (
      <div className="flex-1 bg-[#313338] flex items-center justify-center text-zinc-500 text-lg">
        채팅방을 선택하세요
      </div>
    );
  }
} else {
  if (!roomId) {
    return (
      <div className="flex-1 bg-[#313338] flex items-center justify-center text-zinc-500 text-lg">
        채널을 선택하세요
      </div>
    );
  }
}

  return (
    <div className="flex-1 bg-[#313338] min-h-0 flex">
      <ChatRoom
        roomId={roomId}
        token={token}
        currentUser={{ name: currentUser?.name || "알 수 없음" }}
        subscribe={subscribe}
        send={send}
        connected={connected}
      />
    </div>
  );
}