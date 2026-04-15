import { X } from 'lucide-react';

import { useToast } from '@/components/ui/use-toast';

function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed right-4 top-4 z-[100] flex max-w-sm flex-col gap-2">
      {toasts.map((item) => (
        <div
          key={item.id}
          className={`rounded-lg border px-4 py-3 shadow-lg ${
            item.variant === 'destructive'
              ? 'border-red-200 bg-red-50 text-red-900'
              : 'border-slate-200 bg-white text-slate-900'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              {item.title ? <p className="font-semibold">{item.title}</p> : null}
              {item.description ? <p className="mt-1 text-sm opacity-80">{item.description}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="opacity-60 transition hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export { Toaster };
