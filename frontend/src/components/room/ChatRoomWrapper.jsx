import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchRoomByKey } from "@/api/chatRoom";
import VoiceChannelRoom from "@/components/voice/VoiceChannelRoom";
import TextChatRoom from "@/components/text/TextChatRoom";
import { CircularProgress, Box } from "@mui/material";

export default function ChatRoomWrapper() {
  const { roomKey } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoomByKey(roomKey)
      .then((res) => setRoom(res.data))
      .catch((err) => console.error("채널 불러오기 실패", err))
      .finally(() => setLoading(false));
  }, [roomKey]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (!room) return <div>존재하지 않는 채널입니다.</div>;

  // 채널이 Voice인지 Text인지 분기 렌더링
  return room.type === "VOICE" ? <VoiceChannelRoom room={room} /> : <TextChatRoom room={room} />;
}
