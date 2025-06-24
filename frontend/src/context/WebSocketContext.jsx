import { createContext, useContext } from "react";

export const WebSocketContext = createContext(null);

export const useSocket = () => useContext(WebSocketContext);