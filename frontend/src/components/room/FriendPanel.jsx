// FriendPanel.jsx
import { useEffect, useState } from "react";
import axios from "@/lib/axiosInstance";
import UserItemWithDropdown from "@/components/common/UserItemWithDropdown";
import { useRealtime } from "@/context/RealtimeContext";

export default function FriendPanel() {
  const [friends, setFriends] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState([]);
  const [adding, setAdding] = useState(false);
  const { state } = useRealtime();
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  useEffect(() => {
    console.log("Online Users:", Array.from(state.onlineUsers));
    console.log(state);
    console.log("Friends:", friends);
  }, [state.onlineUsers, friends]);

  useEffect(() => {
    axios.get("/friends").then((res) => setFriends(res.data || []));
  }, []);

  useEffect(() => {
    axios.get("/friends/requests/received").then((res) => setReceivedRequests(res.data || []));
    axios.get("/friends/requests/sent").then((res) => setSentRequests(res.data || []));
  }, []);

  const handleSearch = () => {
    if (!search.trim()) return;
    setResult([]);
    setAdding(true);
    axios
      .get(`/api/members/search?name=${encodeURIComponent(search)}`)
      .then((res) => {
        console.log("검색결과 확인", res.data);
        setResult(res.data || []);
      })
      .finally(() => setAdding(false));
  };

  const handleAdd = (id) => {
    if (!id) {
      console.error("targetMemberId is null or undefined");
      return;
    }
    axios.post("/friends", { targetMemberId: id }).then(() => {
      const newFriend = result.find((r) => r.mno === id || r.id === id || r.memberId === id);
      if (newFriend) {
        setSentRequests((prev) => [
          ...prev,
          {
            requestId: id,
            receiverNickname: newFriend.name,
          },
        ]);
      }
      setShowAdd(false);
      setSearch("");
      setResult([]);
    });
  };

  const handleDelete = (friendId) => {
    if (!window.confirm("정말 이 친구를 삭제하시겠습니까?")) return;
    axios
      .delete(`/friends/${friendId}`)
      .then(() => {
        setFriends((f) => f.filter((friend) => friend.friendId !== friendId));
      })
      .catch((err) => {
        console.error("친구 삭제 실패", err);
        alert("친구 삭제에 실패했습니다.");
      });
  };

  const handleAccept = (friendId) => {
    axios.post(`/friends/${friendId}/accept`).then(() => {
      const acceptedRequest = receivedRequests.find((r) => r.requestId === friendId);
      if (acceptedRequest) {
        setFriends((f) => [
          ...f,
          {
            friendId: acceptedRequest.requestId,
            memberId: acceptedRequest.requesterId,
            name: acceptedRequest.requesterNickname,
            username: acceptedRequest.username || acceptedRequest.requesterUsername,
          },
        ]);
      }
      setReceivedRequests((r) => r.filter((req) => req.requestId !== friendId));
    });
  };

  const handleReject = (friendId) => {
    axios.post(`/friends/${friendId}/reject`).then(() => {
      setReceivedRequests((r) => r.filter((req) => req.requestId !== friendId));
    });
  };

  const handleCancel = (friendId) => {
    axios.delete(`/friends/${friendId}`).then(() => {
      setSentRequests((s) => s.filter((req) => req.requestId !== friendId));
    });
  };

  return (
    <div className="h-full w-full bg-[#313338] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <span className="text-white text-lg font-bold">친구</span>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700 transition"
        >
          유저 검색
        </button>
      </div>

      {receivedRequests.length > 0 && (
        <div className="p-4 border-b border-zinc-800">
          <div className="text-zinc-400 text-sm mb-2">받은 친구 요청</div>
          {receivedRequests.map((req) => (
            <div key={req.requestId} className="flex items-center justify-between py-2 px-2 rounded hover:bg-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                  {req.requesterNickname?.[0] || "?"}
                </div>
                <div>
                  <div className="text-white font-semibold">{req.requesterNickname}</div>
                  <div className="text-zinc-400 text-xs">친구 요청</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(req.requestId)}
                  className="bg-green-600 text-white rounded px-2 py-1 text-sm"
                >
                  수락
                </button>
                <button
                  onClick={() => handleReject(req.requestId)}
                  className="bg-red-600 text-white rounded px-2 py-1 text-sm"
                >
                  거절
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sentRequests.length > 0 && (
        <div className="p-4 border-b border-zinc-800">
          <div className="text-zinc-400 text-sm mb-2">보낸 친구 요청</div>
          {sentRequests.map((req) => (
            <div key={req.requestId} className="flex items-center justify-between py-2 px-2 rounded hover:bg-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                  {req.receiverNickname?.[0] || "?"}
                </div>
                <div>
                  <div className="text-white font-semibold">{req.receiverNickname}</div>
                  <div className="text-zinc-400 text-xs">요청 대기중</div>
                </div>
              </div>
              <button
                onClick={() => handleCancel(req.requestId)}
                className="bg-zinc-600 text-white rounded px-2 py-1 text-sm"
              >
                취소
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-zinc-400 text-sm mb-2">친구 목록</div>
        {friends.length === 0 && <div className="text-zinc-400 text-center py-10">친구 없음</div>}
        {friends.map((f) => (
          <div key={f.friendId} className="flex items-center justify-between py-2 px-2 rounded hover:bg-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                {f?.name?.[0] || "?"}
              </div>
              <div>
                <div className="text-white font-semibold">{f.name}</div>
                <div className="text-zinc-400 text-xs">
                  {state.onlineUsers.has(f.username) ? (
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      온라인
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-gray-500 rounded-full mr-1"></span>
                      오프라인
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDelete(f.friendId)}
              className="bg-red-600 text-white rounded px-2 py-1 text-sm hover:bg-red-700 transition"
            >
              삭제
            </button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded p-6 w-80 flex flex-col gap-3">
            <div className="text-white font-bold mb-2">검색 할 유저 닉네임 입력</div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded p-2"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="닉네임 입력"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
              <button className="bg-blue-600 text-white rounded px-3 py-1" onClick={handleSearch} disabled={adding}>
                검색
              </button>
            </div>
            {adding && <div className="text-zinc-400 text-sm">검색중...</div>}
            <div>
              {result.map((user) => {
                const userId = user.mno || user.id || user.memberId;
                if (!userId) return null;
                return (
                  <UserItemWithDropdown
                    key={userId}
                    user={user}
                    rightElement={
                      <button onClick={() => handleAdd(userId)} className="bg-green-600 text-white rounded px-2 py-1">
                        추가
                      </button>
                    }
                  />
                );
              })}
            </div>
            <button onClick={() => setShowAdd(false)} className="bg-zinc-700 text-white rounded px-3 py-1 mt-2">
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
