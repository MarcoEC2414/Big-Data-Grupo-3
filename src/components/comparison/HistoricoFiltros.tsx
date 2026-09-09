import React from 'react';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarRange, MapPin, GraduationCap } from 'lucide-react';
import {
  PERIODOS_DISPONIBLES,
  SEDES_FILTRO,
  CARRERAS_FILTRO,
} from '@/lib/historico/historicoService';

export interface HistoricoFiltrosState {
  periodoBase: string;
  periodoComparado: string;
  sede: string;
  carrera: string;
}

interface HistoricoFiltrosProps {
  value: HistoricoFiltrosState;
  onChange: (value: HistoricoFiltrosState) => void;
}

export function HistoricoFiltros({ value, onChange }: HistoricoFiltrosProps) {
  const update = (partial: Partial<HistoricoFiltrosState>) =>
    onChange({ ...value, ...partial });

  return (
    <Card className="p-4 print:hidden">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <CalendarRange className="h-3.5 w-3.5" />
            Periodo Base
          </label>
          <Select
            value={value.periodoBase}
            onValueChange={(v) => update({ periodoBase: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS_DISPONIBLES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <CalendarRange className="h-3.5 w-3.5" />
            Periodo Comparado
          </label>
          <Select
            value={value.periodoComparado}
            onValueChange={(v) => update({ periodoComparado: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS_DISPONIBLES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            Sede
          </label>
          <Select value={value.sede} onValueChange={(v) => update({ sede: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEDES_FILTRO.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5" />
            Carrera
          </label>
          <Select value={value.carrera} onValueChange={(v) => update({ carrera: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CARRERAS_FILTRO.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
