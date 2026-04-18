import { useEffect, useState } from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface TaskTimerProps {
  createdAt: string;
  acceptedAt?: string;
  productionTimeHours?: number;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export const TaskTimer = ({ createdAt, acceptedAt, productionTimeHours, priority }: TaskTimerProps) => {
  const [elapsedTime, setElapsedTime] = useState('');
  const [percentage, setPercentage] = useState(0);
  const [colorClass, setColorClass] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      // Используем acceptedAt если есть, иначе createdAt
      const startTime = acceptedAt ? new Date(acceptedAt) : new Date(createdAt);
      const now = new Date();
      const diffMs = now.getTime() - startTime.getTime();

      // Конвертируем в часы
      const hours = diffMs / (1000 * 60 * 60);
      const days = Math.floor(hours / 24);
      const remainingHours = Math.floor(hours % 24);
      const minutes = Math.floor((hours * 60) % 60);

      // Форматируем время
      let timeStr = '';
      if (days > 0) {
        timeStr = `${days}д ${remainingHours}ч`;
      } else if (remainingHours > 0) {
        timeStr = `${remainingHours}ч ${minutes}м`;
      } else {
        timeStr = `${minutes}м`;
      }

      setElapsedTime(timeStr);

      // Если есть нормативное время, вычисляем процент и цвет
      if (productionTimeHours) {
        const percent = (hours / productionTimeHours) * 100;
        setPercentage(percent);

        // Цветовая индикация по проценту
        if (percent < 70) {
          setColorClass('bg-green-100 text-green-800 border-green-300');
        } else if (percent < 100) {
          setColorClass('bg-yellow-100 text-yellow-800 border-yellow-300');
        } else if (percent < 120) {
          setColorClass('bg-orange-100 text-orange-800 border-orange-300');
        } else {
          setColorClass('bg-red-100 text-red-800 border-red-300');
        }
      } else {
        // Без нормы времени - показываем просто серый цвет
        setColorClass('bg-muted text-gray-800 border-gray-300');
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000); // Обновляем каждую минуту

    return () => clearInterval(interval);
  }, [createdAt, acceptedAt, productionTimeHours]);

  // Цвет приоритета (бордер для приоритета) - только для HIGH и URGENT
  const priorityColor = priority === 'URGENT' ? 'border-l-4 border-l-red-600' :
                        priority === 'HIGH' ? 'border-l-4 border-l-orange-500' :
                        '';

  // Показываем метку только для HIGH и URGENT
  const priorityLabel = priority === 'URGENT' ? 'СРОЧНО' :
                        priority === 'HIGH' ? 'Высокий' :
                        null;

  const priorityBadge = priority === 'URGENT' ? 'bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold animate-pulse' :
                        priority === 'HIGH' ? 'bg-orange-500 text-white px-2 py-0.5 rounded text-[10px] font-bold' :
                        null;

  return (
    <div className={`${colorClass} ${priorityColor} border rounded-lg p-1.5 flex items-center justify-between mb-2`}>
      <div className="flex items-center gap-1.5">
        {productionTimeHours && percentage >= 100 ? (
          <AlertCircle size={14} className="flex-shrink-0" />
        ) : productionTimeHours && percentage < 70 ? (
          <CheckCircle size={14} className="flex-shrink-0" />
        ) : (
          <Clock size={14} className="flex-shrink-0" />
        )}
        <div className="flex flex-col">
          <span className="font-medium text-[11px]">
            {acceptedAt ? 'В работе' : 'С создания'}: {elapsedTime}
          </span>
          {productionTimeHours && (
            <span className="text-[10px] opacity-80">
              Норма: {productionTimeHours}ч ({Math.round(percentage)}%)
            </span>
          )}
        </div>
      </div>
      {priorityLabel && priorityBadge && (
        <span className={priorityBadge}>
          {priorityLabel}
        </span>
      )}
    </div>
  );
};
