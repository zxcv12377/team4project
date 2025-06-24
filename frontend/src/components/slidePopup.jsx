import React, { useEffect, useRef, useState } from "react";

function SlidePopup({ show, onClose, children }) {
  const popupRef = useRef();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) setVisible(true);
  }, [show]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleTransitionEnd = () => {
    if (!show) setVisible(false);
  };

  if (!visible && !show) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />

      <div
        ref={popupRef}
        onTransitionEnd={handleTransitionEnd}
        className={`relative ${show ? "opacity-100" : "opacity-0"} transition-opacity duration-300 ease-out`}
      >
        {children}
      </div>
    </div>
  );
}

export default SlidePopup;
