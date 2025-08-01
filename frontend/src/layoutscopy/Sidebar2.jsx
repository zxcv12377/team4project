import { useEffect, useMemo, useRef, useState, useCallback  } from "react";
import { useUserContext } from "@/context/UserContext";
import { useVoiceChat } from "../hooks/useVoiceChat";
import VoiceChannelOuter from "../components/voice/VoiceChannelOuter";
import axiosInstance from "../lib/axiosInstance";
import { useRealtime } from "@/context/RealtimeContext";

export default function Sidebar2({ dmMode, serverId, onSelectFriendPanel, onSelectDMRoom, onSelectChannel }) {
  const { user } = useUserContext();
  const currentUserId = user?.id;

  const [friends, setFriends] = useState([]);
  const [channels, setChannels] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("TEXT");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteChannelId, setInviteChannelId] = useState(null);
  const [currentVoiceRoomId, setCurrentVoiceRoomId] = useState(null);
  const [roomId, setRoomId] = useState(0);
  const { state, dispatch, ready, refreshDmRooms } = useRealtime();
  const dmRooms = state.dmRooms;
  const initialLoadRef = useRef(false);


useEffect(() => {
  if (dmMode && user?.id && ready && !initialLoadRef.current) {
    console.log("🔄 DM 목록 초기 로딩");
    refreshDmRooms?.();
    initialLoadRef.current = true;
  }
}, [dmMode, user?.id, ready, refreshDmRooms]);


  const memoizedMember = useMemo(
    () => ({
      memberId: user?.id,
      name: user?.name,
      profile: user?.profile,
    }),
    [user?.id, user?.name, user?.profile]
  );
  
  const { joined } = useVoiceChat(currentVoiceRoomId, memoizedMember);
  
  const fetchChannels = useCallback(() => {
    axiosInstance
    .get(`/servers/${serverId}/channels`)
    .then((res) => setChannels(Array.isArray(res.data) ? res.data : []))
    .catch(() => setChannels([]));
  }, [serverId]); 
  
    const textChannels = channels.filter((ch) => (ch?.type || "").toUpperCase().trim() === "TEXT");
    const voiceChannels = channels.filter((ch) => (ch?.type || "").toUpperCase().trim() === "VOICE");
  
  useEffect(() => {
    if (dmMode) {
      axiosInstance
        .get("/friends")
        .then((res) => setFriends(Array.isArray(res.data) ? res.data : []))
        .catch(() => setFriends([]));
    }
  }, [dmMode]);

  useEffect(() => {
    if (!dmMode && serverId) fetchChannels();
    else setChannels([]);
  }, [dmMode, serverId, fetchChannels]);


  function handleCreateChannel() {
    if (!newName.trim()) return;
    if (!serverId) {
      alert("serverId가 비어있음. 서버를 선택해주세요.");
      return;
    }
    if (!dmMode) {
      axiosInstance
        .post(`/chatrooms`, {
          name: newName,
          type: newType,
          description: "",
          serverId,
          roomType: "SERVER",
        })
        .then(() => {
          setShowCreate(false);
          setNewName("");
          setNewType("TEXT");
          fetchChannels();
        });
    }
  }

  function handleDeleteChannel(channelId) {
    if (!window.confirm("정말 삭제할까요?")) return;
    axiosInstance.delete(`/chatrooms/${channelId}`).then(fetchChannels);
  }

  function handleInviteCode(serverId) {
    axiosInstance
      .post(`/invites`, {
        serverId,
        expireAt: null,
        maxUses: null,
        memo: "",
      })
      .then((res) => {
        setInviteCode(res.data.code || res.data.inviteCode || "");
      })
      .catch((err) => {
        console.error("❌ 초대코드 생성 실패", err?.response?.data || err.message);
        alert("초대코드 생성에 실패했습니다.");
      });
  }

  function closeInviteModal() {
    setInviteCode("");
    setInviteChannelId(null);
  }

  function handleDeleteDmRoom(roomId) {
    if (!window.confirm("이 DM방을 목록에서 삭제하시겠습니까?")) return;

    axiosInstance.delete(`/dm/room/${roomId}/hide/${currentUserId}`).then(() => {
      dispatch({
        type: "SET_DM_ROOMS",
        payload: dmRooms.filter((room) => room.id !== roomId),
      });
    });
  }

  const handleJoinVoiceChannel = async (channelId) => {
    try {
      if (!channelId) return;
      setRoomId(channelId);
      setCurrentVoiceRoomId(channelId);
    } catch (err) {
      console.error("마이크 접근 실패:", err);
      alert("마이크 장치를 확인해주세요.");
    }
  };

  if (dmMode) {
    return (
      <div className="w-[260px] min-w-[200px] max-w-[320px] flex flex-col h-full bg-[#2b2d31] border-r border-[#232428]">
        <div className="border-b border-[#232428] p-2">
          <button
            className="w-full text-left px-3 py-2 rounded text-white bg-[#2b2d31] hover:bg-[#36393f] transition font-bold"
            onClick={() => onSelectFriendPanel(null)}
          >
            친구
          </button>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-xs text-zinc-400 font-bold">다이렉트 메시지</div>
          <button
            onClick={refreshDmRooms}
            className="text-xs text-zinc-500 hover:text-white transition"
            title="DM 목록 새로고침"
          >
            🔄
          </button>
        </div>
        <ul className="px-2 flex-1 overflow-y-auto">
          {!ready && <li className="px-3 py-2 text-zinc-500 text-sm">연결 중...</li>}
          {ready && dmRooms.length === 0 && (
            <li className="px-3 py-2 text-zinc-500 text-sm">DM 목록이 없습니다</li>
          )}
          {dmRooms?.filter((room) => room.visible).map((room) => (
            <li
              key={room.id}
              className="px-3 py-2 rounded group flex text-white items-center justify-between hover:bg-zinc-800 cursor-pointer transition"
              onClick={() => onSelectDMRoom(room.id)}
            >
              <span className="text-base truncate flex-1">{room?.name || "이름없음"}</span>
              <button
                className="dm-delete-btn text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition ml-2 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteDmRoom(room.id);
                }}
                title="DM 삭제"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="w-[260px] min-w-[200px] max-w-[320px] h-full bg-[#2b2d31] flex flex-col border-r border-[#232428]">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-4 mt-4 mb-1">
          <span className="text-xs text-zinc-400 font-bold">텍스트 채널</span>
          <button
            className="text-xs text-[#3ba55d] hover:text-white bg-[#232428] rounded px-2 py-1 ml-2"
            onClick={() => {
              setNewType("TEXT");
              setShowCreate(true);
            }}
            title="채널 생성"
          >
            ＋
          </button>
        </div>
        <ul className="mb-3 px-2">
          {textChannels.length === 0 && <div className="text-zinc-500 px-2 py-2">없음</div>}
          {textChannels.map((ch, i) => (
            <li
              key={ch.id ?? `textch-${i}`}
              className="flex items-center gap-2 px-2 py-2 rounded hover:bg-zinc-800 group cursor-pointer transition"
              onClick={() => {
                onSelectChannel && onSelectChannel(ch.id);
              }}
            >
              <span className="text-[#8e9297] font-bold">#</span>
              <span className="flex-1">{ch?.name || "이름없음"}</span>
              <button
                className="text-xs text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteChannel(ch.id);
                }}
                title="채널 삭제"
              >
                －
              </button>
              <button
                className="text-xs bg-zinc-700 text-white rounded px-2 py-0.5 ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleInviteCode(serverId);
                }}
              >
                초대
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between px-4 mt-2 mb-1">
          <span className="text-xs text-zinc-400 font-bold">음성 채널</span>
          <button
            className="text-xs text-[#3ba55d] hover:text-white bg-[#232428] rounded px-2 py-1 ml-2"
            onClick={() => {
              setNewType("VOICE");
              setShowCreate(true);
            }}
            title="음성 채널 생성"
          >
            ＋
          </button>
        </div>
        <ul className="px-2">
          {voiceChannels.length === 0 && <div className="text-zinc-500 px-2 py-2">없음</div>}
          {voiceChannels.map((ch, i) => (
            <li
              key={ch.id ?? `voicech-${i}`}
              className="flex items-center gap-2 px-2 py-2 rounded hover:bg-zinc-800 group cursor-pointer transition"
              onClick={() => {
                onSelectChannel?.(ch.id);
                handleJoinVoiceChannel(ch.id);
              }}
            >
              <span>🔊</span>
              <span className="flex-1">{ch?.name || "이름없음"}</span>
              <button
                className="text-xs text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteChannel(ch.id);
                }}
                title="채널 삭제"
              >
                －
              </button>
            </li>
          ))}
        </ul>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-zinc-900 p-4 rounded w-80 flex flex-col gap-2">
            <div className="text-white font-bold mb-2">채널 개설</div>
            <input
              className="p-2 rounded text-black"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="채널명"
            />
            <div className="flex gap-2 mt-2">
              <button onClick={handleCreateChannel} className="flex-1 bg-blue-600 text-white rounded py-1">
                생성
              </button>
              <button onClick={() => setShowCreate(false)} className="flex-1 bg-zinc-700 text-white rounded py-1">
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <VoiceChannelOuter
        roomId={roomId}
        member={{
          name: user?.name,
          memberId: user?.id,
          profile: user?.profile,
        }}
        joined={joined}
        onLeave={() => {
          setRoomId(null);
          setCurrentVoiceRoomId(null);
        }}
      />

      {inviteCode && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-4 rounded w-80 flex flex-col gap-2">
            <div className="text-white font-bold mb-2">초대코드</div>
            <div className="bg-zinc-800 rounded px-4 py-2 font-mono text-xl text-center mb-2">{inviteCode}</div>
            <button
              onClick={() => navigator.clipboard.writeText(inviteCode)}
              className="bg-blue-600 text-white rounded px-3 py-1 mb-2"
            >
              코드 복사
            </button>
            <button onClick={closeInviteModal} className="bg-zinc-700 text-white rounded px-3 py-1 text-xs">
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
