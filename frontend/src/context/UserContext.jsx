import { createContext, useContext, useEffect, useState } from "react";
import axios from "@/lib/axiosInstance";

export const UserContext = createContext({
  user: null,
  name: null,
  setUser: () => {},
  setName: () => {},
  loading: true,
});

export const useUserContext = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await axios.get("/members/me");
      setUser(res.data);
    } catch (err) {
      console.error("유저 정보 가져오기 실패" + err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return <UserContext.Provider value={{ user, setUser, loading }}>{children}</UserContext.Provider>;
};
