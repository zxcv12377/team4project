// // src/hooks/usePresence.tsx
// import { useEffect, useState } from "react";
// import { useWebSocket } from "./useWebSocket";

// interface StatusEvent {
//   username: string;
//   status: "ONLINE" | "OFFLINE";
// }

// /**
//  * token: 로그인 이후 발급받은 JWT
//  * friendsApi: /api/friends/online 으로 Online snapshot을 가져오는 엔드포인트
//  */
// export function usePresence(token: string) {
//   const { connected, subscribe } = useWebSocket(token);
//   const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

//   useEffect(() => {
//     if (!connected) return;

//     // 1) 초기 스냅샷 한 번 가져오기 (선택)
//     fetch("/api/friends/online", {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => res.json())
//       .then((list: string[]) => {
//         setOnlineUsers(new Set(list));
//       })
//       .catch(() => {
//         // 실패해도 계속 STOMP 구독은 유지
//       });

//     // 2) 실시간 이벤트 구독
//     const sub = subscribe("/topic/online-users", (ev: StatusEvent) => {
//       setOnlineUsers((prev) => {
//         const next = new Set(prev);
//         if (ev.status === "ONLINE") next.add(ev.username);
//         else next.delete(ev.username);
//         return next;
//       });
//     });

//     // 언마운트 시 구독 해제
//     return () => {
//       sub && sub.unsubscribe();
//     };
//   }, [connected, subscribe, token]);

//   return onlineUsers;
// }
