import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const COOKIE_KEY = 'cookie_consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] bg-[#111] border-t border-[#C5A55A]/30 px-4 py-4 shadow-2xl">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-gray-400 text-sm flex-1">
          Мы используем файлы cookie для корректной работы сайта и улучшения качества обслуживания.
          Нажимая «Принять», вы соглашаетесь с{' '}
          <Link to="/privacy" className="text-[#C5A55A] hover:underline">
            политикой конфиденциальности
          </Link>
          .
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm border border-[#333] text-gray-400 hover:border-[#C5A55A]/50 hover:text-gray-300 transition-colors rounded"
          >
            Отклонить
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm bg-[#C5A55A] text-[#111] font-semibold hover:bg-[#D4AF37] transition-colors rounded"
          >
            Принять
          </button>
        </div>
      </div>
    </div>
  );
}
