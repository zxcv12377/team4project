import { socket } from "../../lib/socket";

const LeaveVoiceButton = ({ roomId, member, joined, onLeave }) => {
  const handleLeave = () => {
    socket.emit("leaveRoom", roomId); // 서버에 퇴장 알림
    console.log(`${member?.name} 님이 퇴장했습니다.`);

    socket.removeAllListeners("newProducer");
    socket.removeAllListeners("speaking-users");
    onLeave();
  };

  return (
    <div>
      {joined && (
        <div className="flex justify-center gap-2 px-2 py-2 rounded hover:bg-red-600 group cursor-pointer bg-red-500 mb-2">
          <button onClick={handleLeave} className="text-center w-full">
            나가기
          </button>
        </div>
      )}
    </div>
  );
};

export default LeaveVoiceButton;
