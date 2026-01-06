/* eslint-disable react-hooks/set-state-in-effect */

'use client';

// Wrapper para renderizar apenas no client
import { useEffect, useState } from 'react';

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
}

import type { DateRange } from 'react-day-picker';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type Preset = 'day' | 'week' | 'month' | 'year';

type Props = {
  value: {
    preset: Preset;
    range: DateRange;
  };
  onChange: (next: { preset: Preset; range: DateRange }) => void;
  onApply: (range: { from: Date; to: Date }) => void;
  disabled?: boolean;
};

function computePresetRange(preset: Preset, anchorDate: Date): { from: Date; to: Date } {
  // Usar UTC para evitar problemas de timezone
  const year = anchorDate.getUTCFullYear();
  const month = anchorDate.getUTCMonth();
  const day = anchorDate.getUTCDate();

  switch (preset) {
    case 'day': {
      return {
        from: new Date(Date.UTC(year, month, day, 0, 0, 0)),
        to: new Date(Date.UTC(year, month, day, 23, 59, 59)),
      };
    }
    case 'week': {
      // pt-BR (Brasil): semana iniciando no domingo
      const anchor = new Date(Date.UTC(year, month, day));
      const dayOfWeek = anchor.getUTCDay();
      const startDay = day - dayOfWeek;
      const endDay = startDay + 6;
      
      return {
        from: new Date(Date.UTC(year, month, startDay, 0, 0, 0)),
        to: new Date(Date.UTC(year, month, endDay, 23, 59, 59)),
      };
    }
    case 'month': {
      return {
        from: new Date(Date.UTC(year, month, 1, 0, 0, 0)),
        to: new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)),
      };
    }
    case 'year': {
      return {
        from: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
        to: new Date(Date.UTC(year, 11, 31, 23, 59, 59)),
      };
    }
  }
}

export function DashboardFilterBar({ value, onChange, onApply, disabled }: Props) {
  const { preset, range } = value;

  const formatDateUTC = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const label = (() => {
    if (!range?.from) return 'Selecionar período';
    if (!range.to) return formatDateUTC(range.from);

    return `${formatDateUTC(range.from)} - ${formatDateUTC(range.to)}`;
  })();

  const handlePresetChange = (next: string) => {
    if (!next) return;
    const nextPreset = next as Preset;

    // Presets (dia/semana/mês/ano) devem SEMPRE refletir o período atual.
    // Não use o range selecionado anteriormente como referência.
    const anchor = new Date();
    const nextRange = computePresetRange(nextPreset, anchor);

    onChange({
      preset: nextPreset,
      range: { from: nextRange.from, to: nextRange.to },
    });

    onApply(nextRange);
  };

  const handleRangeSelect = (nextRange: DateRange | undefined) => {
    const normalized: DateRange = nextRange ?? { from: undefined, to: undefined };
    onChange({ preset, range: normalized });

    if (normalized.from && normalized.to) {
      // Usar UTC para garantir consistência
      const fromYear = normalized.from.getFullYear();
      const fromMonth = normalized.from.getMonth();
      const fromDay = normalized.from.getDate();
      const toYear = normalized.to.getFullYear();
      const toMonth = normalized.to.getMonth();
      const toDay = normalized.to.getDate();
      
      onApply({
        from: new Date(Date.UTC(fromYear, fromMonth, fromDay, 0, 0, 0)),
        to: new Date(Date.UTC(toYear, toMonth, toDay, 23, 59, 59)),
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <ToggleGroup
        type="single"
        value={preset}
        onValueChange={handlePresetChange}
        className="justify-start"
      >
        <ToggleGroupItem value="day" aria-label="Dia" disabled={disabled}>
          Dia
        </ToggleGroupItem>
        <ToggleGroupItem value="week" aria-label="Semana" disabled={disabled}>
          Semana
        </ToggleGroupItem>
        <ToggleGroupItem value="month" aria-label="Mês" disabled={disabled}>
          Mês
        </ToggleGroupItem>
        <ToggleGroupItem value="year" aria-label="Ano" disabled={disabled}>
          Ano
        </ToggleGroupItem>
      </ToggleGroup>

      <Popover>
        <ClientOnly>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-fit h-12 justify-start text-left font-normal',
                !range?.from && 'text-muted-foreground'
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          </PopoverTrigger>
        </ClientOnly>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            numberOfMonths={2}
            showOutsideDays={false}
            defaultMonth={range?.from ? new Date(range.from.getUTCFullYear(), range.from.getUTCMonth(), range.from.getUTCDate()) : undefined}
            selected={range?.from && range?.to ? {
              from: new Date(range.from.getUTCFullYear(), range.from.getUTCMonth(), range.from.getUTCDate()),
              to: new Date(range.to.getUTCFullYear(), range.to.getUTCMonth(), range.to.getUTCDate())
            } : undefined}
            onSelect={handleRangeSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
