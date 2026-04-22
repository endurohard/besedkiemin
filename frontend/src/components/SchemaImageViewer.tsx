import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, RotateCcw, RotateCw } from 'lucide-react';

interface SchemaImageViewerProps {
  src?: string;
  images?: string[];
  initialIndex?: number;
  alt?: string;
  onClose: () => void;
}

export const SchemaImageViewer = ({
  src,
  images,
  initialIndex = 0,
  alt = 'Схема',
  onClose,
}: SchemaImageViewerProps) => {
  const gallery = images && images.length > 0 ? images : src ? [src] : [];
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(gallery.length - 1, 0)),
  );
  const [rotation, setRotation] = useState(0);

  const total = gallery.length;
  const current = gallery[index];

  const next = () => {
    if (total <= 1) return;
    setIndex((i) => (i + 1) % total);
    setRotation(0);
  };
  const prev = () => {
    if (total <= 1) return;
    setIndex((i) => (i - 1 + total) % total);
    setRotation(0);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, total]);

  if (!current) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
        className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2"
      >
        <X size={24} />
      </button>

      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setRotation((r) => r - 90)}
          aria-label="Повернуть влево"
          className="text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2"
        >
          <RotateCcw size={20} />
        </button>
        <button
          type="button"
          onClick={() => setRotation((r) => r + 90)}
          aria-label="Повернуть вправо"
          className="text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2"
        >
          <RotateCw size={20} />
        </button>
        {total > 1 && (
          <span className="text-white/80 bg-black/40 rounded px-3 py-1 text-sm">
            {index + 1} / {total}
          </span>
        )}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Предыдущее"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Следующее"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      <a
        href={current}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-4 right-4 text-xs text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded px-2 py-1"
      >
        Открыть оригинал
      </a>
      <img
        src={current}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.2s' }}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-md shadow-xl"
      />
    </div>,
    document.body,
  );
};
