import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/Input';
import { ordersApi } from '@/lib/api';

interface CustomerNameInputProps {
  value: string;
  onChange: (value: string, phone?: string, address?: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

interface CustomerSuggestion {
  name: string;
  phone: string;
  address: string;
}

export const CustomerNameInput = ({
  value,
  onChange,
  placeholder = "Введите имя клиента...",
  required = false,
  className = ""
}: CustomerNameInputProps) => {
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const allCustomersRef = useRef<CustomerSuggestion[]>([]);

  useEffect(() => {
    // Загружаем всех клиентов при монтировании компонента
    const loadCustomers = async () => {
      try {
        const orders = await ordersApi.getAll();

        // Создаем уникальный список клиентов
        const customersMap = new Map<string, CustomerSuggestion>();

        orders.forEach((order) => {
          // Используем customerName как ключ для уникальности
          const key = order.customerName.toLowerCase().trim();

          // Пропускаем внутренние заказы
          if (order.customerName === 'Внутренний заказ') return;

          if (!customersMap.has(key)) {
            customersMap.set(key, {
              name: order.customerName,
              phone: order.customerPhone || '',
              address: order.customerAddress || '',
            });
          }
        });

        allCustomersRef.current = Array.from(customersMap.values());
      } catch (error) {
        console.error('Ошибка загрузки клиентов:', error);
      }
    };

    loadCustomers();
  }, []);

  useEffect(() => {
    // Закрываем подсказки при клике вне компонента
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterSuggestions = (query: string) => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    // Фильтруем клиентов по имени
    const filtered = allCustomersRef.current.filter((customer) =>
      customer.name.toLowerCase().includes(query.toLowerCase())
    );

    // Сортируем: сначала те, что начинаются с запроса
    const sorted = filtered.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(query.toLowerCase());
      const bStarts = b.name.toLowerCase().startsWith(query.toLowerCase());

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.localeCompare(b.name);
    });

    setSuggestions(sorted.slice(0, 7)); // Ограничиваем 7 результатами
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);
    filterSuggestions(newValue);
  };

  const handleSelectSuggestion = (suggestion: CustomerSuggestion) => {
    onChange(suggestion.name, suggestion.phone, suggestion.address);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (value && suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        required={required}
        className={className}
        autoComplete="off"
      />

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <div className="font-medium text-sm">{suggestion.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {suggestion.phone}
                {suggestion.address && ` • ${suggestion.address}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      )}
    </div>
  );
};
