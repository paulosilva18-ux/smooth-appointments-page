import { useEffect } from "react";
import { X } from "lucide-react";
import { BookingForm } from "./BookingForm";
import { MyBookings } from "./MyBookings";

export function BookingModal({
  open,
  onClose,
  onReservado,
}: {
  open: boolean;
  onClose: () => void;
  onReservado?: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/85 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Agendar horário"
      onClick={onClose}
    >
      <div
        className="surface-grain relative my-8 w-full max-w-lg border border-border p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-primary"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="eyebrow">Reserve sua cadeira</p>
        <h2 className="text-display mt-2 mb-6 text-3xl">Agendar horário</h2>
        <BookingForm compact />
      </div>
    </div>
  );
}
