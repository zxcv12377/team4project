import { useState } from "react";
import axiosInstance from "../lib/axiosInstance";

export default function VerryconForm() {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("file", file);
    try {
      await axiosInstance.post("/verrycons/upload", formData);
      alert("업로드 완료");
    } catch (error) {
      console.log("upload 실패", error);
      alert("업로드 실패");
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} required />
      <button type="submit">업로드</button>
    </form>
  );
}
