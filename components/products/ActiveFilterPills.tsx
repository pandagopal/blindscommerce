'use client';

import { X } from 'lucide-react';

interface FilterPill {
  type: string;
  value: string;
  label: string;
}

interface ActiveFilterPillsProps {
  filters: FilterPill[];
  onRemove: (type: string, value: string) => void;
  onClearAll: () => void;
}

export default function ActiveFilterPills({
  filters,
  onRemove,
  onClearAll
}: ActiveFilterPillsProps) {
  if (filters.length === 0) return null;

  const getFilterColor = (type: string) => {
    switch (type) {
      case 'category':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'price':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'room':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'sale':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'search':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-sm text-gray-500 mr-1">Active filters:</span>

      {filters.map((filter, index) => (
        <button
          key={`${filter.type}-${filter.value}-${index}`}
          onClick={() => onRemove(filter.type, filter.value)}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors hover:opacity-80 ${getFilterColor(filter.type)}`}
        >
          <span>{filter.label}</span>
          <X size={14} className="opacity-60" />
        </button>
      ))}

      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-gray-500 hover:text-gray-700 underline ml-2"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
