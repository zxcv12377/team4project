import { useTheme } from "@/context/ThemeContext";
import { useUserContext } from "@/context/UserContext";
import { motion } from "framer-motion";
import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = ({ onLogout }) => {
  const context = useUserContext();
  const { user, loading } = context;
  const isLoggedIn = !!localStorage.getItem("token");
  const navigate = useNavigate();
  const { dark, setDark } = useTheme();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
    onLogout?.();
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white dark:bg-[#18181b] text-black dark:text-white shadow-md">
      <div className="flex items-center justify-between px-6 py-4 w-full">
        {/* 왼쪽: 로고 */}
        <div className="text-xl font-bold text-indigo-600">
          <Link to="/">Simple Board</Link>
        </div>

        {/* 오른쪽: 메뉴 */}
        <div className="flex items-center space-x-4 text-sm">
          {/* 로그인 사용자 닉네임 표시 */}
          {isLoggedIn && user?.name && <span className="text-gray-500"> 닉네임: {user.name}</span>}
          <Link to="/posts" className="hover:underline">
            게시판
          </Link>
          {isLoggedIn ? (
            <>
              <Link to="/mypage" className="hover:underline">
                마이페이지
              </Link>
              <button onClick={handleLogout} className="hover:underline">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline">
                로그인
              </Link>
              <Link to="/register" className="hover:underline">
                회원가입
              </Link>
            </>
          )}
          <button
            type="button"
            aria-label="테마 토글"
            onClick={() => setDark((d) => !d)}
            className={`
        relative w-14 h-8 flex items-center px-1 rounded-full border-2
        ${
          dark
            ? "bg-gradient-to-r from-indigo-700 to-zinc-900 border-zinc-700"
            : "bg-gradient-to-r from-yellow-100 to-white border-yellow-200"
        }
        shadow-inner transition-colors duration-300
      `}
          >
            {/* Sun/moon background effect */}
            <motion.span
              className="absolute left-1 top-1/2 -translate-y-1/2 text-yellow-400 text-xl select-none transition"
              animate={{ opacity: dark ? 0 : 1 }}
              transition={{ duration: 0.25 }}
            >
              ☀️
            </motion.span>
            <motion.span
              className="absolute right-1 top-1/2 -translate-y-1/2 text-blue-300 text-xl select-none transition"
              animate={{ opacity: dark ? 1 : 0 }}
              transition={{ duration: 0.25 }}
            >
              🌙
            </motion.span>
            {/* Thumb */}
            <motion.div
              className={`
          z-10 w-6 h-6 rounded-full shadow-lg border-2 border-white
          ${dark ? "bg-zinc-700" : "bg-yellow-300"}
        `}
              animate={{
                x: dark ? 0 : 25,
                backgroundColor: dark ? "#27272a" : "#fde047",
              }}
              transition={{ type: "spring", stiffness: 350, damping: 5 }}
            />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
