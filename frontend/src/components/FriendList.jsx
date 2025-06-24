// src/components/FriendList.jsx
import { useEffect, useState } from "react";
import axios from "@/lib/axiosInstance";

export default function FriendList() {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    axios.get("/friends").then(res => setFriends(res.data));
  }, []);

  return (
    <div>
      <div className="font-bold p-2">친구 목록</div>
      {friends.length === 0 && <div className="text-zinc-400 p-2">친구 없음</div>}
      <ul>
        {friends.map(f => (
          <li key={f.id} className="px-2 py-1 hover:bg-zinc-800 rounded cursor-pointer">
            {f.name}
            {/* 클릭 시 1:1 DM방 진입 처리 (추후 3열에서 분기) */}
          </li>
        ))}
      </ul>
    </div>
  );
}