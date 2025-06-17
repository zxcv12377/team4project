import React from "react";

// axiosInstance: API 호출을 시뮬레이션하기 위한 더미 axios 인스턴스입니다.
// 실제 애플리케이션에서는 실제 백엔드 API와 연동해야 합니다.
export const axiosInstance = {
  get: (url) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // API 호출 지연 시뮬레이션
        if (url === "/friends") {
          resolve({
            data: [
              { id: 1, name: "친구1", profile: "https://placehold.co/40x40/7289DA/ffffff?text=F1" },
              { id: 2, name: "친구2", profile: "https://placehold.co/40x40/7289DA/ffffff?text=F2" },
            ],
          });
        } else if (url.match(/\/servers\/\d+\/channels/)) {
          const serverId = parseInt(url.split("/")[2]);
          if (serverId === 1) {
            // Dummy channels for server 1
            resolve({
              data: [
                { id: 101, name: "일반", type: "TEXT" },
                { id: 102, name: "공지사항", type: "TEXT" },
                { id: 103, name: "자유게시판", type: "TEXT" },
                { id: 104, name: "음성-채팅방", type: "VOICE" },
              ],
            });
          } else if (serverId === 2) {
            // Dummy channels for server 2
            resolve({
              data: [
                { id: 201, name: "프로젝트-알림", type: "TEXT" },
                { id: 202, name: "개발-논의", type: "TEXT" },
                { id: 203, name: "회의실", type: "VOICE" },
              ],
            });
          } else {
            resolve({ data: [] });
          }
        } else if (url.match(/\/servers\/\d+\/members/)) {
          const serverId = parseInt(url.split("/")[2]);
          if (serverId === 1) {
            resolve({
              data: [
                { memberId: 1, name: "관리자", role: "Owner", profile: "https://placehold.co/40x40/3ba55d/ffffff?text=AD" },
                { memberId: 2, name: "참여자A", role: "Member", profile: "https://placehold.co/40x40/99AAB5/ffffff?text=PA" },
                { memberId: 3, name: "참여자B", role: "Member", profile: "https://placehold.co/40x40/99AAB5/ffffff?text=PB" },
              ],
            });
          } else if (serverId === 2) {
            resolve({
              data: [
                { memberId: 4, name: "리더", role: "Lead", profile: "https://placehold.co/40x40/7289DA/ffffff?text=LD" },
                { memberId: 5, name: "개발자", role: "Developer", profile: "https://placehold.co/40x40/99AAB5/ffffff?text=DV" },
              ],
            });
          } else {
            resolve({ data: [] });
          }
        }
        resolve({ data: [] });
      }, 300);
    });
  },
  post: (url, data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (url === "/chatrooms") {
          console.log("Creating channel:", data);
          resolve({ data: { id: Math.floor(Math.random() * 1000) + 300, name: data.name, type: data.type } });
        } else if (url.match(/\/chatrooms\/\d+\/invite/)) {
          const channelId = parseInt(url.split("/")[2]);
          const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          resolve({ data: { code: randomCode, inviteCode: randomCode } });
        }
        resolve({ data: {} });
      }, 300);
    });
  },
  delete: (url) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("Deleting:", url);
        resolve({ data: { success: true } });
      }, 300);
    });
  },
};

// Custom Modals (alert, confirm 대체)
export const AlertDialog = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-zinc-900 p-6 rounded-lg w-80 flex flex-col gap-4 shadow-lg border border-zinc-700">
      <div className="text-white text-lg font-bold">알림</div>
      <p className="text-zinc-300">{message}</p>
      <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 font-semibold transition-colors">
        확인
      </button>
    </div>
  </div>
);

export const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-zinc-900 p-6 rounded-lg w-80 flex flex-col gap-4 shadow-lg border border-zinc-700">
      <div className="text-white text-lg font-bold">확인</div>
      <p className="text-zinc-300">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="bg-zinc-700 hover:bg-zinc-600 text-white rounded-md py-2 px-4 font-semibold transition-colors">
          취소
        </button>
        <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white rounded-md py-2 px-4 font-semibold transition-colors">
          삭제
        </button>
      </div>
    </div>
  </div>
);
