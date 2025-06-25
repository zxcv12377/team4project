import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import axiosInstance from "@/lib/axiosInstance";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import FindAccountModal from "@/components/ui/FindAccountModal";

const LoginPage = ({ onLogin }) => {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const [findMode, setFindMode] = useState(null);

  const onSubmit = async (data) => {
    try {
      const response = await axiosInstance.post("/api/members/login", {
        username: data.username, // 이메일로 로그인
        password: data.password,
      });

      const result = response.data;

      if (result.token && result.username) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("username", result.username); // 이메일
        localStorage.setItem("name", result.name); // 닉네임

        alert("로그인 성공!");

        onLogin(result.token);
        navigate("/");
      } else {
        throw new Error("서버가 사용자 정보를 반환하지 않았습니다.");
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert("로그인 정보가 올바르지 않습니다. 다시 시도해주세요.");
      } else {
        alert("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
      onLogin(null);
      console.error("로그인 에러:", error);
    }
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 dark:bg-[#18181b]">
      <div className="mt-32">
        {/* 상단 영역: 로고/이름/소개 */}
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-1 text-gray-900 dark:text-white">Simple Board</h1>
          <p className="text-gray-500 dark:text-gray-300 text-base">누구나 쉽고 빠르게 글을 남기는 공간</p>
        </div>
        <div className="w-[400px] py-10 px-6 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">로그인</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              placeholder="이메일"
              type="email"
              autoComplete="username"
              {...register("username", { required: true })}
              className="h-12 text-lg placeholder:text-gray-400 placeholder:opacity-80"
            />
            <Input
              placeholder="비밀번호"
              type="password"
              autoComplete="current-password"
              {...register("password", { required: true })}
              className="h-12 text-lg placeholder:text-gray-400 placeholder:opacity-80"
            />
            <Button type="submit" className="w-full h-12 text-lg mt-2 rounded-xl ">
              로그인
            </Button>
          </form>
          {/* 아이디/비번 찾기 버튼 영역 */}
          <div className="flex justify-between mt-5 text-sm">
            <button
              className="px-3 py-1 rounded bg-white hover:bg-blue-100 text-blue-500
               dark:bg-zinc-900 dark:hover:bg-zinc-700 dark:text-blue-400"
              onClick={() => setFindMode("id")}
              type="button"
            >
              아이디 찾기
            </button>
            <button
              className="px-3 py-1 rounded bg-white hover:bg-blue-100 text-blue-500
               dark:bg-zinc-900 dark:hover:bg-zinc-700 dark:text-blue-400"
              onClick={() => setFindMode("pw")}
              type="button"
            >
              비밀번호 찾기
            </button>
          </div>
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-300">
            아직 회원이 아니신가요?{" "}
            <button
              className="px-3 py-1 rounded bg-white hover:bg-blue-100 text-blue-500
               dark:bg-zinc-900 dark:hover:bg-zinc-700 dark:text-blue-400"
              onClick={() => navigate("/register")}
              type="button"
            >
              회원가입
            </button>
          </div>
          {/* 모달 */}
          {findMode && <FindAccountModal mode={findMode} onClose={() => setFindMode(null)} />}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
