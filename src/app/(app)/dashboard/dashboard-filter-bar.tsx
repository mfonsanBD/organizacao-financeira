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

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { endOfDay, endOfMonth, endOfWeek, endOfYear, startOfDay, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
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
  const anchor = startOfDay(anchorDate);

  switch (preset) {
    case 'day': {
      return { from: startOfDay(anchor), to: endOfDay(anchor) };
    }
    case 'week': {
      // pt-BR (Brasil): semana iniciando no domingo
      const from = startOfWeek(anchor, { weekStartsOn: 0 });
      const to = endOfWeek(anchor, { weekStartsOn: 0 });
      return { from: startOfDay(from), to: endOfDay(to) };
    }
    case 'month': {
      const from = startOfMonth(anchor);
      const to = endOfMonth(anchor);
      return { from: startOfDay(from), to: endOfDay(to) };
    }
    case 'year': {
      const from = startOfYear(anchor);
      const to = endOfYear(anchor);
      return { from: startOfDay(from), to: endOfDay(to) };
    }
  }
}

export function DashboardFilterBar({ value, onChange, onApply, disabled }: Props) {
  const { preset, range } = value;

  const label = (() => {
    if (!range?.from) return 'Selecionar período';
    if (!range.to) return format(range.from, 'dd MMM yyyy', { locale: ptBR });

    return `${format(range.from, 'dd MMM yyyy', { locale: ptBR })} - ${format(range.to, 'dd MMM yyyy', { locale: ptBR })}`;
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
      onApply({
        from: startOfDay(normalized.from),
        to: endOfDay(normalized.to),
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
                'w-full justify-start text-left font-normal sm:w-65',
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
            defaultMonth={range?.from}
            selected={range}
            onSelect={handleRangeSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
