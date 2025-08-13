import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../lib/axiosInstance";

const UPLOAD_URL = import.meta.env.VITE_FILE_UPLOAD_URL;
const HTTP = import.meta.env.VITE_HTTP_URL;
const BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL;

export default function BannerControlPage() {
  const { channelId: channelIdParam } = useParams();
  const channelId = useMemo(() => Number(channelIdParam), [channelIdParam]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [serverBanner, setServerBanner] = useState(null); // { id, path, channelId } | null
  const [file, setFile] = useState(null); // File | null
  const [pathInput, setPathInput] = useState(""); // 수동 경로 입력용 (옵션)
  const [msg, setMsg] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.get(`/banner/${channelId}`, {
          validateStatus: (s) => [200, 404].includes(s),
        });
        if (!mounted) return;
        if (data && data.path) {
          setServerBanner(data);
          setPathInput(data.path);
        } else {
          setServerBanner(null);
          setPathInput("");
        }
      } catch (e) {
        console.error(e);
        toast("배너 조회 실패");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [channelId]);

  const currentPreviewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    if (pathInput) return pathInput.startsWith(`${HTTP}`) ? pathInput : `${BASE_URL}${pathInput}`;
    return "";
  }, [file, pathInput]);

  function toast(t) {
    setMsg(t);
    setTimeout(() => setMsg(""), 2500);
  }

  function onPickFile() {
    fileInputRef.current?.click();
  }

  function onFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast("이미지 파일만 업로드하세요.");
      return;
    }
    // (옵션) 용량 제한 예: 5MB
    if (f.size > 5 * 1024 * 1024) {
      toast("파일 용량은 최대 5MB까지 허용됩니다.");
      return;
    }
    setFile(f);
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (!f.type.startsWith("image/")) return toast("이미지 파일만 업로드하세요.");
      if (f.size > 5 * 1024 * 1024) return toast("파일 용량은 최대 5MB까지 허용됩니다.");
      setFile(f);
    }
  }

  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function resetLocal() {
    setFile(null);
    setPathInput(serverBanner?.path || "");
  }

  async function uploadFileIfNeeded() {
    // 파일이 선택된 경우에만 업로드
    if (!file) return pathInput?.trim() || ""; // 파일이 없으면 입력된 path 사용

    const fd = new FormData();
    fd.append("file", file);
    // 서버 구현에 맞게 디렉토리 힌트 전달(선택):
    fd.append("dir", `channel-banners/${channelId}`);

    // const { data } = await axiosInstance.post(UPLOAD_URL, fd, {
    //   headers: { "Content-Type": "multipart/form-data" },
    // });
    const { data } = await axiosInstance.post(UPLOAD_URL, fd);

    const uploadedPath = data?.path || data?.url || (typeof data === "string" ? data : "");
    if (!uploadedPath) throw new Error("업로드 응답에 path/url이 없습니다.");
    return uploadedPath;
  }

  async function onSave() {
    try {
      setSaving(true);
      const finalPath = await uploadFileIfNeeded();
      if (!finalPath) return toast("저장할 경로가 없습니다. 파일을 선택하거나 경로를 입력하세요.");

      const body = { path: finalPath };
      const { data } = await axiosInstance.put(`/banner/${channelId}`, body);
      setServerBanner(data);
      setPathInput(data.path);
      setFile(null);
      toast("배너가 저장되었습니다.");
    } catch (e) {
      console.error(e);
      toast("배너 저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("배너를 삭제할까요?")) return;
    try {
      setDeleting(true);
      await axiosInstance.delete(`/banner/${channelId}`);
      setServerBanner(null);
      setPathInput("");
      setFile(null);
      toast("배너가 삭제되었습니다.");
    } catch (e) {
      console.error(e);
      toast("배너 삭제 실패");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-4">채널 배너 관리</h1>

      {msg && <div className="mb-4 rounded-2xl bg-black/80 px-4 py-2 text-white inline-block shadow">{msg}</div>}

      {loading ? (
        <div className="text-gray-500">불러오는 중...</div>
      ) : (
        <div className="space-y-6">
          {/* 미리보기 */}
          <div className="rounded-2xl border border-dashed border-gray-300 p-4">
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              className="flex flex-col items-center justify-center gap-3 rounded-xl p-6 text-center"
            >
              {currentPreviewUrl ? (
                <img
                  src={currentPreviewUrl}
                  alt="banner-preview"
                  className="max-h-72 w-full rounded-xl object-contain shadow"
                />
              ) : (
                <div className="text-gray-500">배너 이미지가 없습니다. 파일을 선택하거나 경로를 입력하세요.</div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={onPickFile}
                  className="rounded-2xl bg-gray-900 px-4 py-2 text-white shadow hover:bg-gray-800"
                >
                  이미지 선택
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                <button
                  onClick={resetLocal}
                  className="rounded-2xl bg-gray-100 px-4 py-2 text-gray-800 shadow hover:bg-gray-200"
                >
                  초기화
                </button>
              </div>
              <p className="text-xs text-gray-400">PNG/JPG/GIF, 최대 5MB. 드래그&드롭 지원</p>
            </div>
          </div>

          {/* 수동 경로 입력 (선택) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">이미지 경로(선택)</label>
            <input
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              placeholder="/upload/... 혹은 https://..."
              className="w-full rounded-2xl border border-gray-300 px-3 py-2 shadow focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <p className="text-xs text-gray-400">파일을 업로드하지 않으면 이 경로로 저장됩니다.</p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-3">
            <button
              onClick={onSave}
              disabled={saving}
              className="rounded-2xl bg-blue-600 px-5 py-2.5 text-white shadow hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "저장 중..." : serverBanner ? "수정(저장)" : "생성(저장)"}
            </button>

            <button
              onClick={onDelete}
              disabled={deleting || !serverBanner}
              className="rounded-2xl bg-red-600 px-5 py-2.5 text-white shadow hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "삭제 중..." : "삭제"}
            </button>
          </div>

          {/* 현재 서버 상태 */}
          <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
            <div className="font-semibold mb-2">현재 서버 상태</div>
            {serverBanner ? (
              <ul className="list-disc pl-5 space-y-1">
                <li>ID: {serverBanner.id}</li>
                <li>
                  Path: <code className="bg-white rounded px-1">{serverBanner.path}</code>
                </li>
                <li>Channel: {serverBanner.channelId}</li>
              </ul>
            ) : (
              <div>배너가 없습니다.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
