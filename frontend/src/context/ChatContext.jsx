import { createContext, useContext, useState } from "react";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [selectedChannel, setSelectedChannel] = useState(null);

  return (
    <ChatContext.Provider value={{ selectedChannel, setSelectedChannel }}>
      {children}
    </ChatContext.Provider>
  );
};

// 사용 편의 훅
export const useChat = () => useContext(ChatContext);