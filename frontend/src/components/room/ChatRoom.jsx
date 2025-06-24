// import axios from "@/lib/axiosInstance";
// import { useEffect, useRef, useState } from "react";
// import SockJS from "sockjs-client";
// import Stomp from "stompjs";

// export default function ChatRoom({ roomId, token, currentUser }) {
//   const [messageMap, setMessageMap] = useState({}); // { [roomId]: messages[] }
//   const [input, setInput] = useState("");
//   const stompRef = useRef(null);
//   const subscriptionRef = useRef(null);

//   // 현재 roomId 메시지
//   const messages = messageMap[roomId] || [];

//   // 메시지 로딩 (방 진입시)
//   useEffect(() => {
//     if (!roomId) return;
//     // 이미 메모리에 있으면 fetch 안 함
//     if (messageMap[roomId]) return;

//     axios
//       .get(`/chat/${roomId}`)
//       .then((res) => {
//         setMessageMap((prev) => ({
//           ...prev,
//           [roomId]: res.data || [],
//         }));
//       })
//       .catch(() => {
//         setMessageMap((prev) => ({
//           ...prev,
//           [roomId]: [],
//         }));
//       });
//   }, [roomId]);

//   // 소켓 연결 및 구독
//   useEffect(() => {
//     if (!roomId || !token) return;
//     const socket = new SockJS(`http://localhost:8080/ws-chat?token=${token}`);
//     const client = Stomp.over(socket);
//     stompRef.current = client;

//     let connected = false;

//     client.connect({}, () => {
//       connected = true;
//       if (subscriptionRef.current) {
//         subscriptionRef.current.unsubscribe();
//       }
//       subscriptionRef.current = client.subscribe(`/topic/chatroom.${roomId}`, (msg) => {
//         const payload = JSON.parse(msg.body);
//         setMessageMap((prev) => ({
//           ...prev,
//           [roomId]: [...(prev[roomId] || []), payload],
//         }));
//       });
//     });

//     return () => {
//       if (subscriptionRef.current) {
//         subscriptionRef.current.unsubscribe();
//         subscriptionRef.current = null;
//       }
//       if (connected && stompRef.current && stompRef.current.connected) {
//         stompRef.current.disconnect();
//       }
//     };
//   }, [roomId, token]);

//   function sendMessage() {
//     if (!input.trim()) return;
//     if (stompRef.current && stompRef.current.connected) {
//       stompRef.current.send(
//         `/app/chat.send/${roomId}`,
//         {},
//         JSON.stringify({
//           message: input,
//         })
//       );
//       setInput("");
//       // (선택) 로컬 메시지에도 바로 반영하려면 아래 코드도 추가
//       // setMessageMap(prev => ({
//       //   ...prev,
//       //   [roomId]: [...(prev[roomId] || []), { sender: currentUser?.name, message: input }]
//       // }));
//     }
//   }

//   return (
//     <div className="flex flex-col h-full">
//       <div className="flex-1 overflow-y-auto p-2 bg-zinc-950">
//         {messages.map((msg, i) => (
//           <div key={i}>
//             {msg.sender && <span className="font-bold">{msg.sender}:</span>} {msg.message}
//           </div>
//         ))}
//       </div>
//       <div className="flex gap-2 p-2 bg-zinc-900 border-t border-zinc-700">
//         <input
//           className="flex-1 bg-zinc-800 rounded p-2 text-white"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//           placeholder="메시지 입력"
//         />
//         <button className="bg-blue-600 text-white rounded px-4" onClick={sendMessage}>
//           전송
//         </button>
//       </div>
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import axios from "@/lib/axiosInstance";

export default function ChatRoom({ roomId, subscribe, send, connected }) {
  const [messageMap, setMessageMap] = useState({});
  const [input, setInput] = useState("");
  const messages = messageMap[roomId] || [];

  // 메시지 로딩
  useEffect(() => {
    if (!roomId || messageMap[roomId]) return;

    axios
      .get(`/chat/${roomId}`)
      .then((res) => {
        setMessageMap((prev) => ({
          ...prev,
          [roomId]: res.data || [],
        }));
      })
      .catch(() => {
        setMessageMap((prev) => ({
          ...prev,
          [roomId]: [],
        }));
      });
  }, [roomId]);

  // 구독
  useEffect(() => {
    if (!roomId || !connected) return;
    console.log("🟢 Subscribing to", `/topic/chatroom.${roomId} + ${connected}`);
    const sub = subscribe(`/topic/chatroom.${roomId}`, (payload) => {
      setMessageMap((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), payload],
      }));
    });
    return () => {
      sub?.unsubscribe?.();
    };
  }, [roomId, subscribe]);

  function sendMessage() {
    if (!input.trim()) return;
    if (!connected) {
      console.warn("❌ WebSocket not connected. 메시지 전송 실패");
      return;
    }
    send(`/app/chat.send/${roomId}`, {
      message: input,
    });
    setInput("");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-2 bg-zinc-950">
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.sender && <span className="font-bold">{msg.sender}:</span>} {msg.message}
          </div>
        ))}
      </div>
      <div className="flex gap-2 p-2 bg-zinc-900 border-t border-zinc-700">
        <input
          className="flex-1 bg-zinc-800 rounded p-2 text-white"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="메시지 입력"
        />
        <button className="bg-blue-600 text-white rounded px-4" onClick={sendMessage}>
          전송
        </button>
      </div>
    </div>
  );
}
