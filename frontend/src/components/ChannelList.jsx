// src/components/ChannelList.jsx
import { useEffect, useState } from "react";
import axios from "@/lib/axiosInstance";

export default function ChannelList({ serverId }) {
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    if (!serverId) {
      setChannels([]);
      return;
    }
    axios.get(`/servers/${serverId}/channels`).then((res) => setChannels(Array.isArray(res.data) ? res.data : []));
  }, [serverId]);

  return (
    <div>
      <div className="flex justify-between items-center px-2 py-1 font-bold text-red-200">
        채널 목록
        {/* 채널 개설 버튼 등 */}
      </div>
      {channels.length === 0 && <div className="text-zinc-400 p-2">채널 없음</div>}
      <ul>
        {channels.map((ch) => (
          <li key={ch.id} className="px-2 py-1 hover:bg-zinc-800 rounded cursor-pointer flex items-center">
            {/* 텍스트/음성 구분, 초대/삭제 등은 ch.type으로 분기 */}
            <span className="mr-2">{ch.type === "TEXT" ? "#" : "🔊"}</span>
            <span>{ch.name}</span>
            {/* 텍스트 채널이면 초대코드/삭제 버튼 등 추가 */}
          </li>
        ))}
      </ul>
    </div>
  );
}
