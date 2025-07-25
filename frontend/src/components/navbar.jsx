import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import LoginForm from "./loginForm";
import RegisterForm from "./registerForm";
import SlidePopup from "./slidePopup";
import axiosInstance from "../lib/axiosInstance";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [nickname, setNickname] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();

  const uploadURL = import.meta.env.VITE_FILE_UPLOAD_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    if (token) {
      axiosInstance
        .get("/members/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setProfileImage(res.data.profileimg);
          setNickname(res.data.nickname);
        })
        .catch(() => {
          setProfileImage(null);
          setNickname("");
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/boards");
  };

  return (
    <>
      <nav className="bg-white border-b shadow-md fixed top-4 left-0 right-0 z-10 rounded-2xl max-w-[90%] mx-auto">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* 로고 */}
            <div className="flex items-center space-x-2 ">
              <Link to="/" className="flex items-center space-x-2">
                <img src="/STRONGBERRY1.png" alt="logo" className="w-12 h-12 object-contain hover:text-red-400" />
                <span className="text-2xl font-bold text-red-400 hover:text-red-700">STRONGBERRY</span>
              </Link>
            </div>

            {/* 햄버거 버튼 (모바일) */}
            <div className="lg:hidden">
              <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-700 focus:outline-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                  />
                </svg>
              </button>
            </div>

            {/* 메뉴 (PC) */}
            <div className="hidden lg:flex space-x-6 items-center">
              <Link to="/chatting" className="text-gray-700 hover:text-blue-500">
                Chatting
              </Link>
              {isLoggedIn ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-1 text-sm rounded text-gray-700 hover:bg-gray-100"
                  >
                    {profileImage && (
                      <img
                        src={`${uploadURL}/${profileImage}`}
                        alt="프로필"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <p className="text-base font-bold text-slate-700">{nickname}</p>
                  </Link>
                  <button
                    className="px-3 py-1 text-sm rounded text-red-600 hover:text-white border border-red-500 hover:bg-red-500"
                    onClick={handleLogout}
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLogin(true)}
                    className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => setShowRegister(true)}
                    className="text-sm bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 pb-15"
                  >
                    회원가입
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 모바일 메뉴 */}
          {menuOpen && (
            <div className="flex flex-col gap-2 mt-4 lg:hidden">
              <Link to="/chatting" className="text-gray-700 hover:text-blue-500">
                Chatting
              </Link>
              {isLoggedIn ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-400 rounded text-gray-700 hover:bg-gray-100"
                  >
                    {profileImage && (
                      <img
                        src={`${uploadURL}/${profileImage}`}
                        alt="프로필"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    {nickname}
                  </Link>
                  <button
                    className="px-3 py-1 text-sm rounded text-red-600 hover:text-white border border-red-500 hover:bg-red-500 mb-4"
                    onClick={handleLogout}
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowLogin(true)}
                    className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => setShowRegister(true)}
                    className="text-sm bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 mb-3"
                  >
                    회원가입
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      <SlidePopup show={showLogin} onClose={() => setShowLogin(false)}>
        <LoginForm
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      </SlidePopup>

      <SlidePopup show={showRegister} onClose={() => setShowRegister(false)}>
        <RegisterForm
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      </SlidePopup>

      <Outlet />
    </>
  );
}
