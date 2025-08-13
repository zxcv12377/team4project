import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import axiosInstance from "./../lib/axiosInstance";

const BoardChannelEdit = () => {
  const { id } = useParams(); // /admin/channels/edit/:id 에서 추출
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  // 채널 정보 가져오기
  useEffect(() => {
    axiosInstance
      .get(`/board-channels/${id}`)
      .then((res) => {
        setForm({
          name: res.data.name,
          description: res.data.description || "",
        });
        // console.log("get 채널", res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("채널 정보를 불러오지 못했습니다.", err);
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axiosInstance.put(`/board-channels/${id}`, form);
      alert("채널이 성공적으로 수정되었습니다.");
    } catch (err) {
      if (err.response?.status === 403) {
        setError("관리자 권한이 필요합니다.");
      } else if (err.response?.data?.errors) {
        setError(err.response.data.errors[0].defaultMessage);
      } else {
        setError("수정 중 오류가 발생했습니다.");
      }
    }
  };

  if (loading) return <p>로딩 중...</p>;

  return (
    <div className="max-w-xl mx-auto mt-8 p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">채널 수정</h2>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">채널 이름</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            maxLength={15}
            required
            className="border border-gray-300 p-2 rounded w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">설명</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            maxLength={50}
            className="border border-gray-300 p-2 rounded w-full"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          저장
        </button>
      </form>
    </div>
  );
};

export default BoardChannelEdit;
