// src/components/slidePopup.jsx
import React, { useEffect, useRef, useState } from "react";
import styles from "../styles/login-modal.module.scss";

function SlidePopup({ show, onClose, children }) {
  const popupRef = useRef();
  const [visible, setVisible] = useState(false);

  // show가 true 되면 visible도 true로
  useEffect(() => {
    if (show) setVisible(true);
  }, [show]);

  // Esc 누르면 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // 바깥 클릭하면 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // 페이드아웃 트랜지션 끝나면 완전히 제거
  const handleTransitionEnd = () => {
    if (!show) setVisible(false);
  };

  if (!visible && !show) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      {/* 배경 어둡게 */}
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />

      {/* 모달 컨테이너 */}
      <div
        ref={popupRef}
        onTransitionEnd={handleTransitionEnd}
        className={`relative ${show ? "opacity-100" : "opacity-0"} transition-opacity duration-300 ease-out`}
      >
        {/* SCSS 모듈 적용된 모달 프레임 */}
        <div className={styles.form}>
          {/* 로그인 패널 (Panel One) */}
          <div className={`${styles["form-panel"]} ${styles.one}`}>
            <div className={styles["form-header"]}>
              <h1>ACCOUNT LOGIN</h1>
            </div>
            <div className={styles["form-content"]}>{children}</div>
          </div>

          {/* 닫기 토글 버튼 */}
          <div className={` ${styles.visible}`} onClick={onClose} />
        </div>
      </div>
    </div>
  );
}

export default SlidePopup;
