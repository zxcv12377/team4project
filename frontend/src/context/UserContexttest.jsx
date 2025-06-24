import { createContext } from "react";

export const UserContext = createContext({
  name: null,
  setName: () => {},
  // 필요시 mno, email 등 추가
});
