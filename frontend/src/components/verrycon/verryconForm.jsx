import { useState } from "react";
import axiosInstance from "../../lib/axiosInstance";
import { useNavigate } from "react-router-dom";

export default function VerryconForm() {
  const [categoryName, setCategoryName] = useState("");
  const [files, setFiles] = useState(null);
  const [previews, setPreviews] = useState([]);
  const navigate = useNavigate();

  // const generateSlug = (name) => {
  //   return name
  //     .trim()
  //     .toLowerCase()
  //     .replace(/\s+/g, "-") // 공백 → -
  //     .replace(/[^a-z0-9-]/g, ""); // 영문/숫자/-만 남기기
  // };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);

    // 미리보기 URL 생성
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews(previewUrls);
  };

  const handleUploadMultiple = async (e) => {
    e.preventDefault();

    if (!categoryName || files.length === 0) {
      alert("카테고리와 파일을 선택하세요.");
      return;
    }

    const formData = new FormData();
    formData.append("categoryName", categoryName); // 백엔드에서는 categoryName으로 받음
    // formData.append("categorySlug", generateSlug(categoryName));

    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      await axiosInstance.post("/verrycons/upload-multiple", formData);
      alert("업로드 완료!");

      // 미리보기 URL 메모리 해제
      previews.forEach((url) => URL.revokeObjectURL(url));
      setFiles([]);
      setPreviews([]);
      setCategoryName("");
      navigate("/admin/verrycon");
    } catch (err) {
      console.error(err);
      alert("업로드 실패");
    }
  };
  return (
    <div>
      <form onSubmit={handleUploadMultiple}>
        {/* 입력 영역 */}
        <div className="flex justify-center">
          <div className="bg-gray-200 p-4 rounded-xl">
            <label className="block font-semibold mb-2">콘 이름 입력</label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
              className="p-2 m-2 border rounded"
              placeholder="예: 귀여운 이모티콘"
            />
            <input type="file" accept="image/*" multiple onChange={handleFileChange} required className="block mt-2" />
          </div>
        </div>

        {/* 미리보기 영역 */}
        {previews.length > 0 && (
          <div className="max-w-4xl mx-auto mt-8 p-4 rounded-xl border bg-gray-50">
            <div className="grid grid-cols-5 gap-4">
              {previews.map((src, idx) => (
                <div key={idx} className="flex justify-center items-center">
                  <div className="h-[102px] w-[102px] rounded-xl overflow-hidden border flex items-center justify-center">
                    <img src={src} alt={`preview-${idx}`} className="object-cover w-full h-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex justify-center m-5">
          <button
            className="border border-gray-500 bg-rose-400 hover:bg-rose-500 p-1 rounded-xl text-white mr-5 w-[60px] h-[35px]"
            onClick={() => navigate("/admin/verrycon")}
          >
            취소
          </button>
          <button
            type="submit"
            className="border border-gray-500 bg-rose-400 hover:bg-rose-500 p-1 rounded-xl text-white w-[60px] h-[35px]"
          >
            업로드
          </button>
        </div>
      </form>
    </div>
  );

  // return (
  //   <div>
  //     <form onSubmit={handleUploadMultiple}>
  //       <div className="flex justify-center">
  //         <div className="bg-gray-200 p-2 rounded-xl text-border-gray-900">
  //           <label htmlFor="category" className="font-semibold mb-2">
  //             콘 이름 입력
  //           </label>
  //           <input
  //             type="text"
  //             value={categoryName}
  //             onChange={(e) => setCategoryName(e.target.value)}
  //             required
  //             className="p-2 m-4"
  //           />
  //           <input type="file" accept="image/*" multiple onChange={handleFileChange} required className="block" />
  //         </div>
  //       </div>
  //       <div className="max-w-4xl pt-10 l mx-auto mt-24 p-6 rounded-xl border-2 border-gray-300 bg-gray-50">
  //         <div className="grid grid-cols-5 gap-4 mt-6 mb-6 w-[50rem]">
  //           {previews.map((src, idx) => (
  //             <div key={idx} className="flex justify-center itmes-center">
  //               <div className="h-[102px] w-[102px] aspect-square rounded-xl overflow-hidden border">
  //                 <img src={src} alt={`preview-${idx}`} className="w-full h-full object-cover" />
  //               </div>
  //             </div>
  //           ))}
  //         </div>
  //       </div>
  //       <div className="flex justify-center m-5">
  //         <button type="submit" className="border border-gray500 bg-rose-400 hover:bg-rose-500 p-2 rounded-xl">
  //           업로드
  //         </button>
  //       </div>
  //     </form>
  //   </div>
  // );
}
