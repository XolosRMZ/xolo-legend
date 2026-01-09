"use client";

import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ isOpen, title, description, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-obsidian-950/80"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-obsidian-900 p-6 shadow-glow">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-white/70">{description}</p>
            ) : null}
          </div>
          <button
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 transition hover:text-white"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
