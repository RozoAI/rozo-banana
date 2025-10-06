"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  onClose?: () => void;
  withIcon?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Toast({
  message,
  type = "success",
  duration = 5000,
  onClose,
  withIcon = true,
  action,
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
      } w-full max-w-md sm:max-w-md px-4 sm:px-0`}
    >
      <div
        className={`rounded-lg border shadow-lg ${colors[type]} backdrop-blur-sm w-full`}
      >
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3">
          {withIcon && (
            <span className="text-lg sm:text-2xl">{icons[type]}</span>
          )}
          <p className="font-medium text-sm sm:text-base flex-1">{message}</p>
          <button
            onClick={handleClose}
            className="ml-auto text-lg sm:text-xl hover:opacity-70 transition-opacity duration-200"
          >
            ×
          </button>
        </div>
        {action && (
          <div className="px-3 sm:px-4 pb-2 sm:pb-3">
            <button
              onClick={() => {
                action.onClick();
                handleClose();
              }}
              className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-sm font-medium py-2 px-3 rounded-md transition-colors duration-200 border border-yellow-500/30"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
