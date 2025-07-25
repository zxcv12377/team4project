import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [boardCount, setBoardCount] = useState(0);
  const [replyCount, setReplyCount] = useState(0);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchProfile();
    fetchCounts();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/members/me", { headers });
      setProfile(res.data);
      setComment(res.data.comment || "");
    } catch (err) {
      if (err.response?.status === 401) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        localStorage.removeItem("token");
        navigate("/boards");
      } else {
        setError("프로필 정보를 불러오지 못했습니다.");
      }
    }
  };

  const fetchCounts = async () => {
    try {
      const [postsRes, repliesRes] = await Promise.all([
        axios.get("http://localhost:8080/api/boards/my", { headers }),
        axios.get("http://localhost:8080/api/replies/my", { headers }),
      ]);
      setBoardCount(postsRes.data.length);
      setReplyCount(repliesRes.data.length);
    } catch (err) {
      console.error("게시글/댓글 수 조회 실패", err);
    }
  };

  const updateComment = async () => {
    try {
      await axios.put("http://localhost:8080/api/members/comment", { comment }, { headers });
      setMessage("💾 코멘트가 저장되었습니다.");
      setError("");
      fetchProfile();
    } catch (err) {
      setMessage("");
      setError("❌ 코멘트 저장 실패");
    }
  };

  if (!profile) return <div className="text-center mt-10 text-xl">로딩 중... ⏳</div>;

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-2xl border-2 border-green-500 border-solid space-y-6 mt-10">
      <h2 className="text-4xl font-extrabold text-center text-red-500"> MY PROFILE</h2>

      <img
        src={`http://localhost:8080/uploads/${profile.profileimg}`}
        alt="프로필 이미지"
        className="w-36 h-36 object-cover border-4 border-dashed border-black bg-white rounded-xl mx-auto shadow-sm"
      />

      <p className="text-center text-2xl font-bold text-gray-800">{profile.nickname}</p>

      {/* 게시글/댓글 수 */}
      <div className="-mx-6">
        <hr className="border-t border-green-500 my-6" />
      </div>

      <div className="flex justify-center gap-10 text-gray-700 text-lg">
        <Link
          to="/myboard"
          className="flex flex-col items-center hover:text-red-600 hover:underline underline-offset-4"
        >
          <span>📝 작성 게시글</span>
          <span className="text-base font-bold">{boardCount}</span>
        </Link>

        <div className="w-px h-12 bg-green-500 mx-4" />

        <Link
          to="/myreply"
          className="flex flex-col items-center hover:text-red-600 hover:underline underline-offset-4"
        >
          <span>💬 작성 댓글</span>
          <span className="text-base font-bold">{replyCount}</span>
        </Link>
      </div>

      <div className="-mx-6">
        <hr className="border-t border-green-500 my-6" />
      </div>

      {/* 소개 영역 */}
      <div className="bg-green-50 p-4 rounded-xl border-2 border-green-500 space-y-3 shadow-sm">
        <label className="block text-lg font-semibold text-pink-700"> 내 소개</label>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full h-24 p-3 border border-pink-200 rounded-lg bg-white text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-pink-300"
          maxLength={500}
          placeholder="자기소개나 한 마디를 남겨보세요 😊"
        />

        <button
          onClick={updateComment}
          className="w-full py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition"
        >
          💾 코멘트 저장
        </button>

        <button
          className="w-full py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition"
          onClick={() => navigate("/UpdateProfile")}
        >
          ✏️ 수정하기
        </button>
      </div>

      {message && <div className="text-green-600 text-center">{message}</div>}
      {error && <div className="text-red-600 text-center">{error}</div>}
    </div>
  );
};

export default MyProfile;
