import { useEffect, useState } from "react";
import { useRealtime } from "../../context/RealtimeContext";
import { useWebSocket } from "../../hooks/useWebSocket";
import axios from "@/lib/axiosInstance";
import { Bell, Check } from "lucide-react";
import axiosInstance from "../../lib/axiosInstance";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { state } = useRealtime();
  const { subscribe, connected } = useWebSocket();

  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get("/notifications");
      setNotifications(response.data);
    } catch (error) {
      console.error("알림 조회 실패:", error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axiosInstance.get("/notifications/unread/count");
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error("읽지 않은 알림 개수 조회 실패:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axiosInstance.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosInstance.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("모든 알림 읽음 처리 실패:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    if (!connected) return;

    const subscription = subscribe("/user/queue/notifications.*", (message) => {
      setNotifications((prev) => [message, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [subscribe, connected]);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-gray-600 hover:text-gray-800">
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">알림</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:text-blue-800">
                모두 읽음 처리
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">알림이 없습니다</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-4 border-b hover:bg-gray-50 ${!n.isRead ? "bg-blue-50" : ""}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm">{n.message}</p>
                      <span className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    {!n.isRead && (
                      <button onClick={() => markAsRead(n.id)} className="text-gray-400 hover:text-gray-600">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
