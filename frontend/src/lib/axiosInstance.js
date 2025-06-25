// src/lib/axiosInstance.js

import axios from "axios";
import { Navigate } from "react-router-dom";

// 🔧 기본 인스턴스
const axiosInstance = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔧 리프레시 전용 인스턴스 (인터셉터 없이 순수 POST 요청만)
const refreshAxios = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ 상태 변수
let isRefreshing = false;
let refreshSubscribers = [];

// ✅ 새로운 토큰으로 재시도 요청 실행
function onRefreshed(newToken) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

// ✅ 재시도 콜백 등록
function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback);
}

// ✅ 요청 인터셉터: AccessToken 자동 삽입
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ 응답 인터셉터: 401 → RefreshToken 사용하여 재발급
axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalConfig = err.config;

    // AccessToken 만료로 401이면서 아직 재시도 안한 요청일 때
    if (err.response?.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;

      // 🔁 이미 리프레시 중이면 큐에 추가
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken) => {
            originalConfig.headers.Authorization = `Bearer ${newToken}`;
            resolve(axiosInstance(originalConfig));
          });
        });
      }

      // ✅ 최초 리프레시 시도
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        console.log("🔄 AccessToken 만료 → RefreshToken 사용 시도");

        const response = await refreshAxios.post("/auth/refresh", { refreshToken });
        const newAccessToken = response.data.token;

        console.log("✅ 새 AccessToken 재발급 완료");

        // 저장소 갱신
        localStorage.setItem("token", newAccessToken);
        isRefreshing = false;
        onRefreshed(newAccessToken); // 대기 중인 요청들 실행

        // 현재 요청 재시도
        originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalConfig);
      } catch (refreshError) {
        console.warn("❌ RefreshToken 재발급 실패");

        // 세션 초기화
        isRefreshing = false;
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("email");
        localStorage.removeItem("nickname");

        Navigate("/login");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(err);
  }
);

export default axiosInstance;
