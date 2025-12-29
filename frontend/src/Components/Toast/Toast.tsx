import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  duration = 4000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles =
      "fixed top-4 right-4 z-50 max-w-md w-full mx-4 p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out";

    const typeStyles = {
      success: "bg-green-500 text-white",
      error: "bg-red-500 text-white",
      info: "bg-blue-500 text-white",
      warning: "bg-yellow-500 text-white",
    };

    const visibilityStyles = isVisible
      ? "translate-x-0 opacity-100"
      : "translate-x-full opacity-0";

    return `${baseStyles} ${typeStyles[type]} ${visibilityStyles}`;
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-center justify-between">
        <p className="font-medium">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-4 text-white hover:text-gray-200 focus:outline-none"
          aria-label="Close"
        >
          <span className="text-xl">&times;</span>
        </button>
      </div>
    </div>
  );
};

export default Toast;
