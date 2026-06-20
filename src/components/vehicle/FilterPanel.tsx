import { Search, Filter, X } from 'lucide-react';
import { useAppStore } from '@/store';
import { FLEETS, CARGO_TYPE_LABELS } from '@/types';
import type { CargoType } from '@/types';
import { cn } from '@/lib/utils';

export const FilterPanel = () => {
  const { filters, setFilters } = useAppStore();

  const clearFilters = () => {
    setFilters({
      fleet: null,
      cargoType: null,
      arrivalTime: null,
      searchQuery: '',
    });
  };

  const hasActiveFilters = filters.fleet || filters.cargoType || filters.arrivalTime || filters.searchQuery;

  return (
    <div className="bg-deep-blue-800 border-b border-deep-blue-700 p-4">
      <div className="flex items-center gap-4 mb-3">
        <Filter className="w-5 h-5 text-info" />
        <h3 className="text-sm font-semibold text-white">筛选条件</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto flex items-center gap-1 text-xs text-deep-blue-600 hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
            清除筛选
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-deep-blue-600" />
          <input
            type="text"
            placeholder="搜索车牌号、司机、货品..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
            className="w-full pl-9 pr-4 py-2 bg-deep-blue-700 border border-deep-blue-600 rounded-md text-sm text-white placeholder-deep-blue-600 focus:outline-none focus:border-info transition-colors"
          />
        </div>

        <div>
          <select
            value={filters.fleet || ''}
            onChange={(e) => setFilters({ fleet: e.target.value || null })}
            className="w-full px-4 py-2 bg-deep-blue-700 border border-deep-blue-600 rounded-md text-sm text-white focus:outline-none focus:border-info transition-colors appearance-none cursor-pointer"
          >
            <option value="">全部车队</option>
            {FLEETS.map((fleet) => (
              <option key={fleet} value={fleet}>
                {fleet}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filters.cargoType || ''}
            onChange={(e) => setFilters({ cargoType: (e.target.value as CargoType) || null })}
            className="w-full px-4 py-2 bg-deep-blue-700 border border-deep-blue-600 rounded-md text-sm text-white focus:outline-none focus:border-info transition-colors appearance-none cursor-pointer"
          >
            <option value="">全部货品类型</option>
            {(Object.keys(CARGO_TYPE_LABELS) as CargoType[]).map((type) => (
              <option key={type} value={type}>
                {CARGO_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <input
            type="date"
            value={filters.arrivalTime ? filters.arrivalTime.toISOString().split('T')[0] : ''}
            onChange={(e) =>
              setFilters({ arrivalTime: e.target.value ? new Date(e.target.value) : null })
            }
            className={cn(
              'w-full px-4 py-2 bg-deep-blue-700 border border-deep-blue-600 rounded-md text-sm text-white',
              'focus:outline-none focus:border-info transition-colors',
              '[color-scheme:dark]'
            )}
          />
        </div>
      </div>
    </div>
  );
};
