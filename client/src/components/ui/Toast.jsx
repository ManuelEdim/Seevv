import { useEffect, useState } from "react";

const Toast = ({ message, type = "success", onClose, duration = 4000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const types = {
    success: "bg-teal-50 border-teal-400 text-teal-800",
    error: "bg-coral-50 border-coral-400 text-coral-800",
    warning: "bg-amber-50 border-amber-400 text-amber-800",
    info: "bg-brand-50 border-brand-600 text-brand-800",
  };

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "i",
  };

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-lg border
        shadow-modal text-sm font-medium
        transition-all duration-300
        ${types[type]}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
    >
      <span className="font-bold">{icons[type]}</span>
      <span className="flex-1">{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        className="opacity-60 hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </div>
  );
};

// Toast container — place once at app root
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default Toast;
