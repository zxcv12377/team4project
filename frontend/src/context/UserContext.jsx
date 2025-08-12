import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "./../lib/axiosInstance";

// 초기 context 값 정의
export const UserContext = createContext({
  user: null,
  setUser: () => {},
  loading: true,
  token: null,
 setToken: () => {},
 onLoginSuccess: () => {},
});

// 훅으로 바로 사용

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const fetchUser = async () => {
    try {
      const res = await axiosInstance.get("/members/me");
      setUser({ ...res.data, token });
    } catch (err) {
      console.error("유저 정보 가져오기 실패:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        setToken(null);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
   if (!token) {
     // 토큰 없으면 /me 호출하지 말고 바로 idle 상태로
     setUser(null);
     setLoading(false);
     return;
   }
   fetchUser();
 }, [token]);

 // 로그인 성공시 반드시 여기로 토큰 주입
 const onLoginSuccess = (result) => {
   if (result?.token) {
     localStorage.setItem("token", result.token);
     setToken(result.token);
     setLoading(true); // fetchUser가 다시 불리도록
   }
 };

  return (
   <UserContext.Provider value={{ user, setUser, loading, token, setToken, onLoginSuccess }}>
     {children}
   </UserContext.Provider>
 );
};
export const useUserContext = () => useContext(UserContext);
