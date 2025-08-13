import React, { useEffect, useRef } from "react";
import VerryConEditForm from "./VerryConEditForm";

export default function VerryConInlineEditor({ anchorRef, con, onClose, onUpdated }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (!panelRef.current) return;
      if (panelRef.current.contains(e.target)) return;
      if (anchorRef?.current && anchorRef.current.contains(e.target)) return;
      onClose?.();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [anchorRef, onClose]);

  return (
    <div ref={panelRef} className="absolute top-full left-0 mt-2 z-50 min-w-[500px]">
      <div className="rounded-2xl border shadow-lg bg-white p-3">
        <VerryConEditForm con={con} onUpdated={onUpdated} onCancel={onClose} />
      </div>
    </div>
  );
}
