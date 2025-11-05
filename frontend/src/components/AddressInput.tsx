import { useState, useEffect, useRef } from 'react';
import { ordersApi } from '@/lib/api';

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const AddressInput = ({
  value,
  onChange,
  placeholder = "Введите адрес...",
  required = false,
  className = ""
}: AddressInputProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const allAddressesRef = useRef<string[]>([]);

  useEffect(() => {
    // Загружаем все адреса из заказов
    const loadAddresses = async () => {
      try {
        const orders = await ordersApi.getAll();
        const addressesSet = new Set<string>();

        orders.forEach((order) => {
          if (order.customerAddress && order.customerAddress.trim()) {
            addressesSet.add(order.customerAddress.trim());
          }
        });

        allAddressesRef.current = Array.from(addressesSet);
      } catch (error) {
        console.error('Ошибка загрузки адресов:', error);
      }
    };

    loadAddresses();
  }, []);

  useEffect(() => {
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
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = allAddressesRef.current.filter((address) =>
      address.toLowerCase().includes(query.toLowerCase())
    );

    const sorted = filtered.sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(query.toLowerCase());
      const bStarts = b.toLowerCase().startsWith(query.toLowerCase());
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    });

    const finalSuggestions = sorted.slice(0, 7);
    setSuggestions(finalSuggestions);
    setShowSuggestions(finalSuggestions.length > 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      filterSuggestions(newValue);
    }, 200);
  };

  const handleSelectSuggestion = (address: string) => {
    onChange(address);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        autoComplete="off"
      />

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((address, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
              onClick={() => handleSelectSuggestion(address)}
            >
              <div className="font-medium text-sm">{address}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
