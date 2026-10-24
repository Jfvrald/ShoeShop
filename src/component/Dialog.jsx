import React, { useEffect, useRef } from "react";
import { X } from "@phosphor-icons/react";

export default function Dialog({ title, close, children, drawer = false, message }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={drawer ? "dialog drawer" : "dialog"}
      onCancel={close}
      onClick={(event) => {
        if (event.target === ref.current) close();
      }}
    >
      <div className="dialog-head">
        <h2>{title}</h2>
        <button className="icon-button" aria-label="Close dialog" onClick={close}>
          <X size={18} weight="bold" />
        </button>
      </div>
      {message && (
        <p className="dialog-feedback" role="status">
          {message}
        </p>
      )}
      {children}
    </dialog>
  );
}
