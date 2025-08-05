// axiosInstance.js
import axios from "axios";

// 🔧 기본 인스턴스
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  // headers: {
  //   "Content-Type": "application/json",
  // },
});

// 🔧 리프레시 전용 인스턴스 (인터셉터 없이 순수 POST 요청만)
const refreshAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ 상태 변수
let isRefreshing = false;
let refreshSubscribers = [];

// 🔧 최대 재시도 횟수
const MAX_RETRY = 1;

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

    // 초기화: 기본 0
    originalConfig._retryCount = originalConfig._retryCount || 0;

    // AccessToken 만료로 401이면서 아직 최대 재시도 안 한 요청일 때
    if (err.response?.status === 401 && originalConfig._retryCount < MAX_RETRY) {
      originalConfig._retryCount++;

      const refreshToken = localStorage.getItem("refresh_token");

      // RefreshToken 없으면 즉시 종료
      if (!refreshToken) {
        // 리프레시 토큰이 없으면, 사용자는 그냥 로그아웃 상태인 것.
        // 에러를 그대로 반환하여 각 컴포넌트가 처리하도록 함.
        // 여기서 페이지를 리로드하면 무한 루프 발생.
        return Promise.reject(err);
      }

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
        console.log("🔄 AccessToken 만료 → RefreshToken 사용 시도");

        const response = await refreshAxios.post("/auth/refresh", { refreshToken });
        const newAccessToken = response.data.token;

        console.log("✅ 새 AccessToken 재발급 완료");

        localStorage.setItem("token", newAccessToken);
        isRefreshing = false;
        onRefreshed(newAccessToken); // 대기 중인 요청들 실행

        originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalConfig);
      } catch (refreshError) {
        console.error("❌ RefreshToken 재발급 실패. 세션을 초기화하고 로그인 페이지로 이동합니다.");

        isRefreshing = false;
        clearSession(); // 세션 정보 모두 삭제

        // 로그인 페이지로 리다이렉트. 사용자의 세션이 만료되었음을 명확히 함.
        if (window.location.pathname !== "/") {
          window.location.replace("/");
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(err);
  }
);

// ✅ 세션 초기화 함수
function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

// ✅ 로그인 페이지 이동 함수 (중복 이동 방지)
// function redirectToLogin() {
//   if (window.location.pathname !== "/") {
//     window.location.replace("/"); // replace → 히스토리 안 쌓임
//   }
// }

export default axiosInstance;
