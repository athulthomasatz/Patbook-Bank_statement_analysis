import { useState, useCallback } from "react";

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", title, duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, title, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message, title) => addToast(message, "success", title), [addToast]);
  const error = useCallback((message, title) => addToast(message, "error", title), [addToast]);
  const warning = useCallback((message, title) => addToast(message, "warning", title), [addToast]);
  const info = useCallback((message, title) => addToast(message, "info", title), [addToast]);

  return { toasts, addToast, removeToast, success, error, warning, info };
}
