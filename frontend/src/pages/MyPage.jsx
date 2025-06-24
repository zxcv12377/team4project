import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserContext } from "../context/UserContext";

const MyPage = () => {
  const [nickname, setNickname] = useState("");
  const [originalNickname, setOriginalNickname] = useState("");
  const [isAvailable, setIsAvailable] = useState(null);
  const [nicknameMsg, setNicknameMsg] = useState("");

  const { user, setUser } = useUserContext(); // 수정

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    axiosInstance.get("/members/me").then((res) => {
      setNickname(res.data.nickname || "");
      setOriginalNickname(res.data.nickname);
    });
  }, []);

  const checkNickname = async () => {
    if (!nickname) return;
    try {
      const res = await axiosInstance.get("/api/members/check-nickname", {
        params: { nickname },
      });

      if (nickname === originalNickname) {
        setIsAvailable(true);
        setNicknameMsg("현재 사용 중인 닉네임입니다.");
      } else if (res.data === true) {
        setIsAvailable(false);
        setNicknameMsg("이미 사용 중인 닉네임입니다.");
      } else {
        setIsAvailable(true);
        setNicknameMsg("사용 가능한 닉네임입니다.");
      }
    } catch (e) {
      console.log(e);
      setNicknameMsg("닉네임 중복 확인 실패");
    }
  };

  const handleSaveNickname = async () => {
    if (!isAvailable) return alert("닉네임 중복 확인이 필요합니다.");

    try {
      const res = await axiosInstance.put("/api/members/nickname", {
        name: nickname,
      });
      const data = res.data;

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      setOriginalNickname(nickname);
      setNickname(nickname);

      // UserContext 업데이트
      setUser((prev) => ({
        ...prev,
        name: nickname,
      }));

      alert("닉네임이 변경되었습니다.");
    } catch (e) {
      console.log(e);
      alert("닉네임 변경 실패");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg("");
    setPwSuccess(false);

    if (newPw.length < 6) {
      setPwMsg("새 비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (newPw !== newPw2) {
      setPwMsg("새 비밀번호가 서로 다릅니다.");
      return;
    }

    try {
      await axiosInstance.put("/api/members/password", {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      setPwMsg("비밀번호가 성공적으로 변경되었습니다.");
      setPwSuccess(true);
      setCurrentPw("");
      setNewPw("");
      setNewPw2("");
    } catch (err) {
      setPwMsg(err.response?.data?.message || "비밀번호 변경 실패 (현재 비밀번호가 일치하지 않습니다.)");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 space-y-8">
      <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">마이페이지</h2>

      {/* 닉네임 변경 */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow space-y-4">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">닉네임 변경</h3>
        <div className="flex gap-2">
          <Input
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setIsAvailable(null);
              setNicknameMsg("");
            }}
            className="flex-1 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
            placeholder="닉네임 입력"
          />
          <Button variant="outline" onClick={checkNickname}>
            중복 확인
          </Button>
        </div>
        {nicknameMsg && <p className={`text-sm ${isAvailable ? "text-green-500" : "text-red-500"}`}>{nicknameMsg}</p>}
        <Button onClick={handleSaveNickname} disabled={isAvailable !== true} className="mt-2 w-full">
          저장
        </Button>
      </div>

      {/* 비밀번호 변경 */}
      <form
        className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow space-y-4"
        onSubmit={handlePasswordChange}
      >
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">비밀번호 변경</h3>
        <Input
          type="password"
          placeholder="현재 비밀번호"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          required
          className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
        />
        <Input
          type="password"
          placeholder="새 비밀번호 (6자 이상)"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          required
          className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
        />
        <Input
          type="password"
          placeholder="새 비밀번호 확인"
          value={newPw2}
          onChange={(e) => setNewPw2(e.target.value)}
          required
          className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
        />
        {pwMsg && <p className={`text-sm ${pwSuccess ? "text-green-500" : "text-red-500"}`}>{pwMsg}</p>}
        <Button type="submit" className="mt-2 w-full">
          비밀번호 변경
        </Button>
      </form>
    </div>
  );
};

export default MyPage;
