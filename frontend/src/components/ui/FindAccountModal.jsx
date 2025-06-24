import { useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

// props: mode ("id" | "pw"), onClose

const FindAccountModal = ({ mode, onClose }) => {
  const [step, setStep] = useState("username"); // "username" | "verify" | "result"
  const [username, setUsername] = useState(""); // 이메일
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState(""); // name값 또는 완료메시지
  // 비밀번호 변경용
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");

  // 이메일 인증 코드 발송
  const sendCode = async () => {
    setMsg("");
    try {
      await axiosInstance.post("/auth/email/send", { username });
      setMsg("인증코드가 전송되었습니다.");
      setStep("verify");
    } catch (e) {
      console.log(e);
      setMsg("이메일 발송 실패");
    }
  };

  // 인증 코드 확인
  const verifyCode = async () => {
    setMsg("");
    try {
      await axiosInstance.post("/auth/email/verify", { username, code });
      setStep("result");
      setMsg("");
    } catch (e) {
      console.log(e);
      setMsg("인증코드가 올바르지 않습니다.");
    }
  };

  // 비밀번호 변경
  const resetPassword = async (e) => {
    e.preventDefault();
    setMsg("");
    if (newPw !== newPw2) {
      setMsg("비밀번호가 서로 다릅니다.");
      return;
    }
    try {
      await axiosInstance.put("/api/members/password/reset", { email: username, newPassword: newPw });
      setResult("비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.");
    } catch (e) {
      console.log(e);
      setMsg("비밀번호 변경 실패");
    }
  };

  // 아이디(=name) 찾기
  const findId = async () => {
    try {
      const res = await axiosInstance.get("/auth/email/find-id", { params: { username } });
      // name을 리턴해야 정상!
      setResult(`당신의 아이디: ${res.data || "(조회 실패)"}`);
    } catch {
      setResult("아이디 조회 실패");
    }
  };

  // 화면
  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-8 w-[360px] space-y-4 relative">
        <button
          className="absolute right-3 top-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
          onClick={onClose}
        >
          ✖
        </button>
        <h3 className="font-bold text-lg mb-2 dark:text-zinc-100">{mode === "id" ? "아이디 찾기" : "비밀번호 찾기"}</h3>

        {/* STEP 1: 이메일(=username) 인증 */}
        {step === "username" && (
          <>
            <Input type="email" placeholder="이메일" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Button className="w-full" onClick={sendCode} disabled={!username}>
              인증코드 받기
            </Button>
            {msg && <p className="text-red-500 text-sm">{msg}</p>}
          </>
        )}

        {/* STEP 2: 인증 코드 확인 */}
        {step === "verify" && (
          <>
            <Input placeholder="인증코드" value={code} onChange={(e) => setCode(e.target.value)} maxLength={8} />
            <Button className="w-full" onClick={verifyCode} disabled={!code}>
              인증코드 확인
            </Button>
            {msg && <p className="text-red-500 text-sm">{msg}</p>}
          </>
        )}

        {/* STEP 3: 결과 폼 */}
        {step === "result" && (
          <>
            {/* 아이디 찾기 */}
            {mode === "id" &&
              (result ? (
                <div className="text-center my-6">
                  <p className="font-bold dark:text-zinc-100">{result}</p>
                  <Button className="mt-4 w-full" onClick={onClose}>
                    확인
                  </Button>
                </div>
              ) : (
                <Button className="w-full" onClick={findId}>
                  아이디 확인하기
                </Button>
              ))}
            {/* 비밀번호 찾기 */}
            {mode === "pw" &&
              (result ? (
                <div className="text-center my-6">
                  <p className="font-bold dark:text-zinc-100">{result}</p>
                  <Button className="mt-4 w-full" onClick={onClose}>
                    로그인하기
                  </Button>
                </div>
              ) : (
                <form className="space-y-2" onSubmit={resetPassword}>
                  <Input
                    type="password"
                    placeholder="새 비밀번호"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="새 비밀번호 확인"
                    value={newPw2}
                    onChange={(e) => setNewPw2(e.target.value)}
                    required
                  />
                  {msg && <p className="text-red-500 text-sm">{msg}</p>}
                  <Button className="w-full" type="submit">
                    비밀번호 변경
                  </Button>
                </form>
              ))}
          </>
        )}
      </div>
    </div>
  );
};

export default FindAccountModal;
