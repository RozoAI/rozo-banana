"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  onClose?: () => void;
}

export function Toast({
  message,
  type = "success",
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 200); // Match the exit animation duration
  };

  if (!isVisible) return null;

  const icons = {
    success: "🎉",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
  };

  const colors = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  };

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-300 ease-out ${
        isExiting ? "opacity-0 -translate-y-5" : "opacity-100 translate-y-0"
      }`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${colors[type]} max-w-md backdrop-blur-sm`}
      >
        <span className="text-2xl">{icons[type]}</span>
        <p className="font-medium">{message}</p>
        <button
          onClick={handleClose}
          className="ml-auto text-xl hover:opacity-70 transition-opacity duration-200"
        >
          ×
        </button>
      </div>
    </div>
  );
}
