import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

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
      const res = await axiosInstance.get("/members/me");
      const token = localStorage.getItem("token");
      setUser({ ...res.data, token });
      console.log("UserContext data : ", { ...res.data, token });
    } catch (err) {
      console.error("유저 정보 가져오기 실패" + err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) fetchUser();
    else setLoading(false);
  }, []);

  return <UserContext.Provider value={{ user, setUser, loading }}>{children}</UserContext.Provider>;
};
