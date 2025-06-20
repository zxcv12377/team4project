// src/lib/axiosInstance.js

import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "/api", // vite 설정에서 /api → 8080 포워딩 되어 있으므로
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// 요청 인터셉터: 토큰 자동 포함
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
