import { useState, createContext, useContext, useReducer, useEffect } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { useUserContext } from "@/context/UserContext";
import { usePing } from "@/hooks/usePing";

const RealtimeContext = createContext();

const initialState = {
  onlineUsers: new Set(),
  notifications: [],
  typingUsers: new Map(),
  readStatus: new Map(),
};

function realtimeReducer(state, action) {
  switch (action.type) {
    case "SET_ONLINE_USERS":
      return { ...state, onlineUsers: new Set(action.payload) };
    case "USER_STATUS_CHANGE": {
      const newSet = new Set(state.onlineUsers);
      if (action.payload.status === "ONLINE") newSet.add(action.payload.username);
      else if (action.payload.status === "OFFLINE") newSet.delete(action.payload.username);
      return { ...state, onlineUsers: newSet };
    }
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [...state.notifications, action.payload] };
    case "TYPING_STATUS":
      return {
        ...state,
        typingUsers: new Map(state.typingUsers).set(action.payload.username, action.payload.isTyping),
      };
    default:
      return state;
  }
}

export function RealtimeProvider({ children, socket }) {
  const [state, dispatch] = useReducer(realtimeReducer, initialState);
  const [ready, setReady] = useState(false);
  const { user } = useUserContext();
  const username = user?.username;
  const token = user?.token;

  const { connected, subscribe, connect, disconnect } = socket;
  usePing();

  useEffect(() => {
    if (token) {
      console.log("🟥 RealtimeProvider Mounted");
      connect(token, () => {
        console.log("🟢 WebSocket connected → setReady(true)");
        setReady(true);
      });
    }

    return () => {
      disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!connected || !ready) return;

    axiosInstance
      .get("/friends/online")
      .then((res) => {
        dispatch({ type: "SET_ONLINE_USERS", payload: res.data || [] });
      })
      .catch((err) => {
        console.error("❌ /friends/online 실패:", err);
      });
  }, [connected, ready]);

  useEffect(() => {
    if (!connected || !ready || !username) return;

    const subStatus = subscribe(`/user/queue/status`, (ev) => {
      dispatch({ type: "USER_STATUS_CHANGE", payload: ev });
    });

    const subNoti = subscribe(`/user/queue/notifications.${username}`, (msg) => {
      dispatch({ type: "ADD_NOTIFICATION", payload: msg });
    });

    return () => {
      subStatus.unsubscribe();
      subNoti.unsubscribe();
    };
  }, [connected, ready, subscribe, username]);

  return <RealtimeContext.Provider value={{ state, dispatch }}>{children}</RealtimeContext.Provider>;
}

export const useRealtime = () => useContext(RealtimeContext);
