import { Search, X } from 'lucide-react';
import { Input } from './ui/input';
import { cn } from '../utils';

interface GroupSearchInputProps {
  /** Текущий поисковый запрос */
  value: string;
  /** Обработчик изменения запроса */
  onChange: (value: string) => void;
}

export function GroupSearchInput({ value, onChange }: GroupSearchInputProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Поиск по тикеру, например GOLD"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn('pl-9', value ? 'pr-9' : undefined)}
      />
      {value ? (
        <button
          type="button"
          aria-label="Очистить поиск"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => onChange('')}
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
