// src/components/layout/MainLayout.jsx
import { useState, useEffect } from "react";
import Sidebar1 from "./Sidebar1";
import Sidebar2 from "./Sidebar2";
import Sidebar3 from "./Sidebar3";
import Sidebar4 from "./Sidebar4";
import Navbar from "@/components/ui/Navbar";

export default function MainLayout() {
  const [selectedDM, setSelectedDM] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  useEffect(() => {
    const savedServerId = localStorage.getItem("selectedServerId");
    const savedDM = localStorage.getItem("selectedDM");
    const savedRoomId = localStorage.getItem("selectedRoomId");

    if (savedDM === "true") {
      setSelectedDM(true);
      setSelectedServerId(null);
    } else if (savedServerId) {
      setSelectedServerId(Number(savedServerId));
      setSelectedDM(false);
    }
    if (savedRoomId) {
      setSelectedRoomId(Number(savedRoomId));
    }
  }, []);

  // --- 저장 ---
  function handleSelectDM() {
    setSelectedDM(true);
    setSelectedServerId(null);
    setSelectedRoomId(null);

    localStorage.setItem("selectedDM", "true");
    localStorage.removeItem("selectedServerId");
    localStorage.removeItem("selectedRoomId");
  }
  function handleSelectServer(id) {
    setSelectedDM(false);
    setSelectedServerId(id);
    setSelectedRoomId(null);
    localStorage.setItem("selectedServerId", id);
    localStorage.setItem("selectedDM", "false");
    localStorage.removeItem("selectedRoomId");
  }
  function handleSelectChannel(id) {
    setSelectedRoomId(id);
    localStorage.setItem("selectedRoomId", id);
  }

  return (
    <div className="flex h-screen w-screen">
      <Navbar />
      <div className="flex h-full w-full pt-16">
        <Sidebar1 onSelectDM={handleSelectDM} onSelectServer={handleSelectServer} />
        <Sidebar2 dmMode={selectedDM} serverId={selectedServerId} onSelectChannel={handleSelectChannel} />
        <Sidebar3 dmMode={selectedDM} serverId={selectedServerId} roomId={selectedRoomId} />
        <Sidebar4 serverId={selectedServerId} roomId={selectedRoomId} />
      </div>
    </div>
  );
}
