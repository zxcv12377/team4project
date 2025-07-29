import styles from "./BWbutton.module.css";

export default function BWButton({ children, onClick, variant, kind }) {
  const btnClass = variant ? styles[`${kind}-btn-${variant}`] : styles["custom-btn"];

  return (
    <button className={`${styles["custom-btn"]} ${btnClass}`} onClick={onClick}>
      {children}
    </button>
  );
}
