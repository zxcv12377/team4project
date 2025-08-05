import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "./../lib/axiosInstance";

// 초기 context 값 정의
export const UserContext = createContext({
  user: null,
  setUser: () => {},
  loading: true,
});

// 훅으로 바로 사용

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await axiosInstance.get("/members/me");
      const token = localStorage.getItem("token");
      setUser({ ...res.data, token });
    } catch (err) {
      console.error("유저 정보 가져오기 실패:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
      }
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
export const useUserContext = () => useContext(UserContext);
