// src/components/layout/MainLayout.jsx

import { useUserContext } from "../context/UserContext";
import Sidebar1 from "./Sidebar1";
import Sidebar2 from "./Sidebar2";
import Sidebar3 from "./Sidebar3";
import Sidebar4 from "./Sidebar4";
import { useState, useEffect,useContext } from "react";
import { Outlet } from "react-router-dom";
import NotificationCenter from "./../components/notification/NotificationCenter";
import { WebSocketContext } from "../context/WebSocketContext";

export default function MainLayout() {
  const [selectedDM, setSelectedDM] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [speakingUsers, setSpeakingUsers] = useState([]);
  const [friendMode, setFriendMode] = useState(false);
  const { user } = useUserContext();
  const token = user?.token || localStorage.getItem("token");
  const { subscribe, send, connected } = useContext(WebSocketContext);


  console.log("▶️ MainLayout user:", user);
  console.log("▶️ MainLayout token:", user?.token);
  useEffect(() => {
    const sd = localStorage.getItem("selectedDM") === "true";
    setSelectedDM(sd);
    setSelectedServerId(sd ? null : Number(localStorage.getItem("selectedServerId")));
    setSelectedRoomId(Number(localStorage.getItem("selectedRoomId")));
    setFriendMode(localStorage.getItem("friendMode") === "true");
  }, []);

  // DM/서버/채널/친구 패널 선택 핸들러들
  function handleSelectDM() {
    setSelectedDM(true);
    setSelectedServerId(null);
    setSelectedRoomId(null);
    setFriendMode(false);
    localStorage.setItem("selectedDM", "true");
    localStorage.removeItem("selectedServerId");
    localStorage.removeItem("selectedRoomId");
    localStorage.setItem("friendMode", "false");
  }
  function handleSelectServer(id) {
    setSelectedDM(false);
    setSelectedServerId(id);
    setSelectedRoomId(null);
    setFriendMode(false);
    localStorage.setItem("selectedDM", "false");
    localStorage.setItem("selectedServerId", String(id));
    localStorage.removeItem("selectedRoomId");
    localStorage.setItem("friendMode", "false");
  }
  function handleSelectChannel(id) {
    setSelectedRoomId(id);
    setFriendMode(false);
    localStorage.setItem("selectedRoomId", String(id));
    localStorage.setItem("friendMode", "false");
  }
  function handleSelectFriendPanel() {
    setSelectedRoomId(null);
    setFriendMode(true);
    localStorage.removeItem("selectedRoomId");
    localStorage.setItem("friendMode", "true");
  }
  function handleSelectDMRoom(id) {
    setSelectedRoomId(id);
    setFriendMode(false);
    localStorage.setItem("selectedRoomId", String(id));
    localStorage.setItem("friendMode", "false");
  }

  return (
    // ① token 은 RealtimeContext 내에서 localStorage.getItem('token') 으로 꺼내므로
    //    MainLayout 에서는 그냥 RealtimeProvider 로 감싸주기만 하면 됩니다.
    <div className="flex flex-col h-screen w-screen">
      {/* <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex-1" />
          <NotificationCenter />
        </div>
      </header> */}

      <div className="flex flex-1 min-h-0">
        <Sidebar1 onSelectDM={handleSelectDM} onSelectServer={handleSelectServer} />
        <Sidebar2
          dmMode={selectedDM}
          serverId={selectedServerId}
          onSelectFriendPanel={handleSelectFriendPanel}
          onSelectDMRoom={handleSelectDMRoom}
          onSelectChannel={handleSelectChannel}
        />
        <Sidebar3
          dmMode={selectedDM}
          serverId={selectedServerId}
          roomId={selectedRoomId}
          friendMode={friendMode}
          subscribe={subscribe}
          send={send}
          currentUser={user}
        />
        <Sidebar4 serverId={selectedServerId} roomId={selectedRoomId} />
        {/* <div className="flex-1 min-w-0"><Outlet /></div> */}
      </div>
    </div>
  );
}
