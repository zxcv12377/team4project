// Toaster.jsx
import { useState, useEffect } from "react";

export function Toaster({ message, type = "info", duration = 3000, onClose }) {
  const [visible, setVisible] = useState(!!message);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose(); // 상태 클리어 콜백
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!visible) return null;

  return (
    <div className={`fixed bottom-5 right-5 px-4 py-2 rounded text-white shadow `}>
      <strong className="block">{type.toUpperCase()}</strong>
      <p>{message}</p>
    </div>
  );
}
