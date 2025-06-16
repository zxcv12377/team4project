import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Layoutex = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div>
      <header className="flex justify-end px-4 py-2 bg-gray-200">
        {token ? (
          <>
            <Link to="/profile" style={{ marginRight: 10 }}>
              내 프로필
            </Link>
            <button onClick={handleLogout}>로그아웃</button>
          </>
        ) : (
          location.pathname !== "/login" &&
          location.pathname !== "/register" && (
            <>
              <Link to="/login" style={{ marginRight: 10 }}>
                로그인
              </Link>
              <Link to="/register">회원가입</Link>
            </>
          )
        )}
      </header>
      <main style={{ padding: 20 }}>{children}</main>
    </div>
  );
};

export default Layoutex;
