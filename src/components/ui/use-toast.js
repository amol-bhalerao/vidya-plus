import { useEffect, useState } from 'react';

let toastState = [];
const listeners = new Set();

function notify() {
  const snapshot = [...toastState];
  listeners.forEach((listener) => listener(snapshot));
}

function dismiss(id) {
  toastState = toastState.filter((item) => item.id !== id);
  notify();
}

function toast({ title, description, variant = 'default', duration = 3000 } = {}) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  toastState = [...toastState, { id, title, description, variant }];
  notify();

  if (duration > 0) {
    setTimeout(() => dismiss(id), duration);
  }

  return {
    id,
    dismiss: () => dismiss(id),
  };
}

function useToast() {
  const [toasts, setToasts] = useState(toastState);

  useEffect(() => {
    listeners.add(setToasts);
    return () => listeners.delete(setToasts);
  }, []);

  return {
    toast,
    dismiss,
    toasts,
  };
}

export { toast, useToast };
