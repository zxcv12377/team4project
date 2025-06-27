import axios from "@/lib/axiosInstance";
import { useEffect, useMemo, useState } from "react";
import { useUserContext } from "@/context/UserContext";
import { useVoiceChat } from "./../hooks/useVoiceChat";
import VoiceChannelOuter from "../components/voice/VoiceChannelOuter";


export default function Sidebar2({ dmMode, serverId, onSelectFriendPanel, onSelectDMRoom, onSelectChannel }) {
  const { user } = useUserContext();
  const currentUserId = user?.id; // ✅ 수정됨

  const [friends, setFriends] = useState([]);
  const [channels, setChannels] = useState([]);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("TEXT");

  const [inviteCode, setInviteCode] = useState("");
  const [inviteChannelId, setInviteChannelId] = useState(null);

  const [currentVoiceRoomId, setCurrentVoiceRoomId] = useState(null);
  const [speakingUsers, setSpeakingUsers] = useState([]);
  const [roomId, setRoomId] = useState(0);

  // const { joined } = useVoiceChat(currentVoiceRoomId, {
  //   memberId: user?.id,
  //   name: user?.name,
  //   profile: user?.profile,
  // });

  // useVoiceChat(currentVoiceRoomId, user);

  const memoizedMember = useMemo(
    () => ({
      memberId: user?.id,
      name: user?.name,
      profile: user?.profile,
    }),
    [user?.id, user?.name, user?.profile]
  );

  const { joined } = useVoiceChat(currentVoiceRoomId, memoizedMember);

  useEffect(() => {
    if (dmMode) {
      axios
        .get("/friends")
        .then((res) => setFriends(Array.isArray(res.data) ? res.data : []))
        .catch(() => setFriends([]));
    }
  }, [dmMode]);

  useEffect(() => {
    if (!dmMode && serverId) fetchChannels();
    else setChannels([]);
  }, [dmMode, serverId]);

  function fetchChannels() {
    axios
      .get(`/servers/${serverId}/channels`)
      .then((res) => setChannels(Array.isArray(res.data) ? res.data : []))
      .catch(() => setChannels([]));
  }

  function handleCreateChannel() {
    if (!newName.trim()) return;
    if (!serverId) {
      alert("serverId가 비어있음. 서버를 선택해주세요.");
      return;
    }
    if (!dmMode) {
      axios
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
    axios.delete(`/chatrooms/${channelId}`).then(fetchChannels);
  }

  function handleInviteCode(channelId) {
    axios.post(`/chatrooms/${channelId}/invite`).then((res) => {
      setInviteCode(res.data.code || res.data.inviteCode || "");
      setInviteChannelId(channelId);
    });
  }

  function closeInviteModal() {
    setInviteCode("");
    setInviteChannelId(null);
  }

  const handleJoinVoiceChannel = async (channelId) => {
    try {
      if (!channelId) {
        console.log("채널 ID 없음. joinRoom 생략");
        return;
      }
      setRoomId(channelId);
      console.log(joined);
      console.log(channelId + "번 방에 입장하셨습니당");
      setCurrentVoiceRoomId(channelId);
    } catch (err) {
      console.error("마이크 접근 실패:", err);
      alert("마이크 장치를 확인해주세요.");
    }
  };

  const textChannels = channels.filter((ch) => (ch?.type || "").toUpperCase().trim() === "TEXT");
  const voiceChannels = channels.filter((ch) => (ch?.type || "").toUpperCase().trim() === "VOICE");

  if (dmMode) {
    return (
      <div className="flex flex-col h-full bg-[#232428]">
        <div className="border-b border-[#232428] p-2">
          <button
            className="w-full text-left px-3 py-2 rounded text-white bg-[#2b2d31] hover:bg-[#36393f] transition font-bold"
            onClick={() => onSelectFriendPanel(null)}
          >
            친구
          </button>
        </div>
        <div className="text-xs text-zinc-400 px-4 py-3 font-bold">다이렉트 메시지</div>
        <ul className="px-2">
          {friends.map((f) => (
            <li
              key={f.friendId}
              className="px-3 py-2 rounded flex items-center hover:bg-zinc-800 cursor-pointer transition"
              onClick={async () => {
                console.log("DM방 생성 요청", {
                  myId: currentUserId,
                  friendId: f.memberId,
                });
                try {
                  const res = await axios.post("/dm/room", {
                    myId: currentUserId,
                    friendId: f.memberId,
                  });
                  const roomId = res.data.id;
                  onSelectDMRoom(roomId);
                } catch (err) {
                  console.error("DM방 요청 실패", err);
                }
              }}
            >
              <span className="w-8 h-8 rounded-full bg-[#232428] flex items-center justify-center mr-2">
                {(f?.name && f.name[0]) || "?"}
              </span>
              <span className="text-base">{f?.name || "이름없음"}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="w-[260px] min-w-[200px] max-w-[320px] h-full bg-[#2b2d31] flex flex-col border-r border-[#232428]">
      <div className="flex-1 flex flex-col">
        {/* 텍스트 채널 */}
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
                  handleInviteCode(ch.id);
                }}
              >
                초대
              </button>
            </li>
          ))}
        </ul>

        {/* 음성 채널 */}
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
                if (!user) {
                  alert("로그인이 필요합니다.");
                  return;
                }
                onSelectChannel?.(ch.id);
                handleJoinVoiceChannel(ch.id, user.id);
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

      {/* 채널 생성 모달 */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-zinc-900 p-4 rounded w-80 flex flex-col gap-2">
            <div className="text-white font-bold mb-2">채널 개설</div>
            <input
              className="p-2 rounded"
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
      {/* 초대코드 모달 */}
      {inviteCode && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-4 rounded w-80 flex flex-col gap-2">
            <div className="text-white font-bold mb-2">초대코드</div>
            <div className="bg-zinc-800 rounded px-4 py-2 font-mono text-xl text-center mb-2">{inviteCode}</div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteCode);
              }}
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
