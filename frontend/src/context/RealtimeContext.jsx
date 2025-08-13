// src/context/RealtimeContext.jsx
import { useState, createContext, useContext, useReducer, useEffect, useRef } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { UserContext } from "./UserContext";
import { usePing } from "@/hooks/usePing";
import { useToast } from "@/hooks/use-toast";

const RealtimeContext = createContext();

const initialState = {
  onlineUsers: new Set(),
  notifications: [],
  typingUsers: new Map(),
  readStatus: new Map(),
  receivedRequests: [],
  sentRequests: [],
  friends: [],
  dmRooms: [],
  serverMembers: {},
  loadingServerMembers: new Set(),
};

function normalizeEmail(ev) {
  return (ev?.email || ev?.Email || ev?.userEmail || "").toLowerCase();
}

function normalizeOnlineList(arr) {
  // /friends/online 응답이 문자열 배열 또는 객체 배열 모두 처리
  if (!Array.isArray(arr)) return [];
  return arr.map((x) =>
    typeof x === "string" ? x.toLowerCase() : normalizeEmail(x)
  ).filter(Boolean);
}

function realtimeReducer(state, action) {
  switch (action.type) {

    case "CLEAR_SERVER_MEMBERS": {
     const { serverId } = action.payload || {};
     if (!serverId) return state;
     const next = { ...state.serverMembers };
     delete next[serverId];
     return { ...state, serverMembers: next };
   }
   case "PRUNE_SERVER_KEYS": {
     // 보유중인 서버 id 목록으로 캐시 가지치기
     const valid = new Set(action.payload || []);
     const next = {};
     Object.keys(state.serverMembers).forEach((k) => {
       if (valid.has(Number(k))) next[k] = state.serverMembers[k];
     });
     return { ...state, serverMembers: next };
   }
    case "SET_ONLINE_USERS":
     return { ...state, onlineUsers: new Set(normalizeOnlineList(action.payload)) };
    case "USER_STATUS_CHANGE": {
     const email = normalizeEmail(action.payload);
     if (!email) return state;
     const newSet = new Set(state.onlineUsers);
     if ((action.payload.status || "").toUpperCase() === "ONLINE") newSet.add(email);
     else if ((action.payload.status || "").toUpperCase() === "OFFLINE") newSet.delete(email);
      return { ...state, onlineUsers: newSet };
    }
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [...state.notifications, action.payload] };
    case "TYPING_STATUS":
      return {
        ...state,
        typingUsers: new Map(state.typingUsers).set(action.payload.email, action.payload.isTyping),
      };
    case "SET_RECEIVED":
      return { ...state, receivedRequests: action.payload };
    case "SET_SENT":
      return { ...state, sentRequests: action.payload };
    case "SET_FRIENDS":
      return { ...state, friends: action.payload };
    case "REMOVE_FRIEND":
      return {
        ...state,
        friends: state.friends.filter((f) => f.friendId !== action.payload),
      };
    case "SET_DM_ROOMS":
      return { ...state, dmRooms: action.payload };

    case "SET_SERVER_MEMBERS":{
      const { serverId, members } = action.payload || {};
  if (!serverId) return state;
  return {
    ...state,
    serverMembers: {
      ...state.serverMembers,
      [serverId]: Array.isArray(members) ? members : [],
        },
      };
    }
    case "START_LOADING_SERVER_MEMBERS":
      return {
        ...state,
        loadingServerMembers: new Set(state.loadingServerMembers).add(action.payload),
      };
    case "FINISH_LOADING_SERVER_MEMBERS": {
      const newSet = new Set(state.loadingServerMembers);
      newSet.delete(action.payload);
      return {
        ...state,
        loadingServerMembers: newSet,
      };
    }
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

export function RealtimeProvider({ children, socket }) {
  const [state, dispatch] = useReducer(realtimeReducer, initialState);
  const [ready, setReady] = useState(false);
  const { user, token, loading: userLoading  } = useContext(UserContext);
  const subscribeFnRef = useRef(null);
  const unsubscribeFnRef = useRef(null);
  const { connected, subscribe, connect, disconnect } = socket;
  const serverUnsubsRef = useRef(new Map()); // serverId -> unsubscribe()
  const { toast } = useToast();

  usePing();

  const initFriendState = async () => {
    try {
      const [friendsRes, receivedRes, sentRes, onlineRes, dmRoomsRes] = await Promise.all([
        axiosInstance.get("/friends"),
        axiosInstance.get("/friends/requests/received"),
        axiosInstance.get("/friends/requests/sent"),
        axiosInstance.get("/friends/online"),
        axiosInstance.get(`/dm/rooms/${user.id}`),
      ]);
      dispatch({ type: "SET_FRIENDS", payload: friendsRes.data || [] });
      dispatch({ type: "SET_RECEIVED", payload: receivedRes.data || [] });
      dispatch({ type: "SET_SENT", payload: sentRes.data || [] });
      dispatch({ type: "SET_ONLINE_USERS", payload: onlineRes.data || [] });
      dispatch({ type: "SET_DM_ROOMS", payload: dmRoomsRes.data || [] });
      await refreshDmRooms();
      console.log("✅ 친구 상태 초기화 완료");
    } catch (err) {
      console.error("❌ 친구 상태 초기화 실패:", err);
    }
  };

  const refreshDmRooms = async () => {
    try {
      console.log("🔄 DM 목록 새로고침 시작...");
      const dmRoomsRes = await axiosInstance.get(`/dm/rooms/${user.id}`);
      dispatch({ type: "SET_DM_ROOMS", payload: dmRoomsRes.data || [] });
      console.log("✅ DM 목록 새로고침 완료:", dmRoomsRes.data);
    } catch (err) {
      console.error("❌ DM 목록 새로고침 실패:", err);
    }
  };

  const fetchAndSetServerMembers = async (serverId) => {
    try {
      dispatch({ type: "START_LOADING_SERVER_MEMBERS", payload: serverId });
      const res = await axiosInstance.get(`/servers/${serverId}/members`);
      const data = Array.isArray(res.data) ? res.data : [];
      dispatch({
        type: "SET_SERVER_MEMBERS",
        serverId,
        payload: { serverId, members: data.filter((m) => m && typeof m === "object") },
      });
    } catch (err) {
      console.error(`❌ 서버 멤버 갱신 실패 (serverId=${serverId}):`, err);
      dispatch({ type: "SET_SERVER_MEMBERS",payload: { serverId, members: [] },
       });
    } finally {
      dispatch({ type: "FINISH_LOADING_SERVER_MEMBERS", payload: serverId });
    }
  };

  useEffect(() => {
   if (!userLoading && token && user?.id) {
      console.log("🟥 RealtimeProvider Mounted");
      connect(token, () => {
        console.log("🟢 WebSocket connected → setReady(true)");

        subscribeFnRef.current = subscribeAll;
        setReady(true);
        initFriendState();
      });
    }
    return () => {
      unsubscribeFnRef.current?.();
      disconnect();
    };
  }, [userLoading, token, user?.id]);

  useEffect(() => {
    if (connected && ready && subscribeFnRef.current) {
      console.log("🔄 재연결 후 수동 재구독 시도");
      subscribeFnRef.current();
    }
  }, [connected]);

  function subscribeAll() {
    const email = user?.email;
    if (!email || !user?.id) {
      console.warn("⚠️ username 또는 user.id 누락 → 구독 스킵");
      return () => {};
    }

    if (unsubscribeFnRef.current) {
      console.log("🧹 이전 구독 해제 시도...");
      unsubscribeFnRef.current();
    }

    console.log("🔔 WebSocket 구독 시작:", email);

    const subStatus = subscribe(`/user/queue/status`, (ev) => {
      const me = (user?.email || "").toLowerCase();
      const who = normalizeEmail(ev);
      dispatch({ type: "USER_STATUS_CHANGE", payload: ev });
      if (who && who !== me) {
        toast({
          title: ev.status === "ONLINE" ? "🔔 친구 접속" : "🔕 친구 퇴장",
          description: `${ev.email}님이 ${ev.status} 상태가 되었습니다.`,
        });
      }
    });

    const subBroadcast = subscribe(`/topic/status`, (ev) => {
      dispatch({ type: "USER_STATUS_CHANGE", payload: ev });
    });

    const subNoti = subscribe(`/user/queue/notifications.${email}`, (msg) => {
      dispatch({ type: "ADD_NOTIFICATION", payload: msg });
    });

    const subFriend = subscribe(`/user/queue/friend`, async (payload) => {
      try {
        const type = payload.type;
        if (
          ["REQUEST_RECEIVED", "REQUEST_SENT", "REQUEST_CANCELLED", "REQUEST_ACCEPTED", "REQUEST_REJECTED"].includes(
            type
          )
        ) {
          const [friendsRes, receivedRes, sentRes, onlineRes] = await Promise.all([
            axiosInstance.get("/friends"),
            axiosInstance.get("/friends/requests/received"),
            axiosInstance.get("/friends/requests/sent"),
            axiosInstance.get("/friends/online"),
          ]);
          dispatch({ type: "SET_FRIENDS", payload: friendsRes.data || [] });
          dispatch({ type: "SET_RECEIVED", payload: receivedRes.data || [] });
          dispatch({ type: "SET_SENT", payload: sentRes.data || [] });
          dispatch({ type: "SET_ONLINE_USERS", payload: onlineRes.data || [] });
        }

        if (type === "FRIEND_DELETED") {
          const friendId = payload.payload?.requestId;
          if (friendId) dispatch({ type: "REMOVE_FRIEND", payload: friendId });
        }

        if (type === "FRIEND_STATUS_CHANGE") {
          const onlineRes = await axiosInstance.get("/friends/online");
          dispatch({ type: "SET_ONLINE_USERS", payload: onlineRes.data || [] });
        }
      } catch (err) {
        console.error("❌ 친구 이벤트 WebSocket 처리 실패:", err);
      }
    });

    const subDmRestore = subscribe(`/user/queue/dm-restore`, async (payload) => {
      try {
        await refreshDmRooms();
        toast({
          title: "💬 DM 복구",
          description: payload.status === "NEW" ? "새로운 DM방이 생성되었습니다." : "숨겨진 DM방이 복구되었습니다.",
        });
      } catch (err) {
        console.error("❌ DM 복구 처리 실패:", err);
      }
    });

    // ✅ 서버 멤버 개별 구독
    const serverSubscriptions = [];
    const subscribeServerMemberEvents = async () => {
      try {
        const res = await axiosInstance.get("/servers/my");
        const servers = res.data || [];
        servers.forEach((server) => {
          const sub = subscribe(`/topic/server.${server.id}.members`, async (payload) => {
            if (payload.serverId === server.id) {
              await fetchAndSetServerMembers(server.id);
            }
          });
          serverSubscriptions.push(sub);
          fetchAndSetServerMembers(server.id);
        });
      } catch (err) {
        console.error("❌ 서버 멤버 구독 실패:", err);
      }
    };
    subscribeServerMemberEvents();

    // ✅ 해제 함수 저장
    const unsubscribe = () => {
      subStatus?.unsubscribe?.();
      subBroadcast?.unsubscribe?.();
      subNoti?.unsubscribe?.();
      subFriend?.unsubscribe?.();
      subDmRestore?.unsubscribe?.();
      serverSubscriptions.forEach((sub) => sub?.unsubscribe?.());
      serverUnsubsRef.current.forEach((fn) => fn?.());
      serverUnsubsRef.current.clear();
      console.log("✅ WebSocket 구독 해제 완료");
    };
    unsubscribeFnRef.current = unsubscribe;
    console.log("✅ 모든 WebSocket 구독 완료");
    return unsubscribe;
  }

  const subscribeServerMember = (serverId) => {
    if (!serverId || typeof subscribe !== "function") return;

    const sub = subscribe(`/topic/server.${serverId}.members`, async (payload) => {
      if (payload.serverId === serverId) {
        await fetchAndSetServerMembers(serverId);
      }
    });

    serverUnsubsRef.current.get(serverId)?.();
    serverUnsubsRef.current.set(serverId, () => sub?.unsubscribe?.());
  };

  const unsubscribeServerMember = (serverId) => {
    serverUnsubsRef.current.get(serverId)?.(); // 실행
    serverUnsubsRef.current.delete(serverId);
    };

  return (
    <RealtimeContext.Provider
      value={{
        state,
        dispatch,
        ready,
        refreshDmRooms,
        fetchAndSetServerMembers,
        subscribeServerMember,
        unsubscribeServerMember,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtime = () => useContext(RealtimeContext);
