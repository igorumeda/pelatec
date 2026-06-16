"use client";

import { useMemo, useState } from "react";
import { Repeat2 } from "lucide-react";
import { DateInput } from "@/components/date-input";
import { Field } from "@/components/ui";
import { cn } from "@/lib/utils";

const weekdays = [
  { value: "0", short: "D", label: "Domingo" },
  { value: "1", short: "S", label: "Segunda" },
  { value: "2", short: "T", label: "Terça" },
  { value: "3", short: "Q", label: "Quarta" },
  { value: "4", short: "Q", label: "Quinta" },
  { value: "5", short: "S", label: "Sexta" },
  { value: "6", short: "S", label: "Sábado" }
];

type RoundFormFieldsProps = {
  defaultDate?: string;
  defaultTime?: string | null;
  defaultVenue?: string | null;
};

export function RoundFormFields({ defaultDate = "", defaultTime, defaultVenue }: RoundFormFieldsProps) {
  const [roundDate, setRoundDate] = useState(defaultDate);
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [interval, setInterval] = useState(1);
  const [unit, setUnit] = useState<"week" | "month">("week");
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>(() => {
    if (!defaultDate) return [String(new Date().getDay())];
    return [String(localDateFromIso(defaultDate).getDay())];
  });
  const [endType, setEndType] = useState<"never" | "on" | "after">("never");

  const recurrenceSummary = useMemo(() => {
    if (!recurrenceEnabled) return "Sem recorrência";
    const unitLabel = unit === "week" ? (interval === 1 ? "semana" : "semanas") : (interval === 1 ? "mês" : "meses");
    const days = unit === "week"
      ? selectedWeekdays.map((value) => weekdays.find((day) => day.value === value)?.label).filter(Boolean).join(", ")
      : "no mesmo dia do mês";
    return `Repete a cada ${interval} ${unitLabel}${days ? ` - ${days}` : ""}`;
  }, [interval, recurrenceEnabled, selectedWeekdays, unit]);

  function toggleWeekday(value: string) {
    setSelectedWeekdays((current) => {
      if (current.includes(value)) {
        return current.length === 1 ? current : current.filter((item) => item !== value);
      }
      return [...current, value].sort((a, b) => Number(a) - Number(b));
    });
  }

  function handleRoundDateChange(value: string) {
    setRoundDate(value);
    if (!recurrenceEnabled && value) setSelectedWeekdays([String(localDateFromIso(value).getDay())]);
  }

  return (
    <>
      <Field label="Título"><input name="title" placeholder="Rodada de quinta" /></Field>
      <Field label="Data"><DateInput name="round_date" required value={roundDate} onChange={handleRoundDateChange} /></Field>
      <Field label="Início"><input name="starts_at" type="time" required defaultValue={defaultTime?.slice(0, 5) ?? ""} /></Field>
      <Field label="Local"><input name="venue" defaultValue={defaultVenue ?? ""} /></Field>
      <Field label="Limite de jogadores"><input name="player_limit" type="number" min="1" /></Field>
      <Field label="Observações"><textarea name="notes" rows={3} /></Field>

      <div className="rounded-3xl border border-panel-200 bg-panel-50/85 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="recurrence_enabled"
            checked={recurrenceEnabled}
            onChange={(event) => setRecurrenceEnabled(event.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="flex items-center gap-2 font-semibold text-slate-900">
              <Repeat2 size={16} />
              Recorrência personalizada
            </span>
            <span className="mt-1 block text-sm text-slate-600">{recurrenceSummary}</span>
          </span>
        </label>

        {recurrenceEnabled ? (
          <div className="mt-5 space-y-5 border-t border-panel-200 pt-5">
            <div className="grid gap-3 sm:grid-cols-[auto,88px,1fr] sm:items-center">
              <span className="text-sm font-medium text-slate-700">Repetir a cada:</span>
              <input
                name="recurrence_interval"
                type="number"
                min={1}
                max={52}
                value={interval}
                onChange={(event) => setInterval(Math.max(1, Number(event.target.value) || 1))}
                className="text-center"
              />
              <select name="recurrence_unit" value={unit} onChange={(event) => setUnit(event.target.value as "week" | "month")}>
                <option value="week">semana</option>
                <option value="month">mês</option>
              </select>
            </div>

            {unit === "week" ? (
              <div>
                <p className="text-sm font-medium text-slate-700">Repetir:</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {weekdays.map((day) => {
                    const active = selectedWeekdays.includes(day.value);
                    return (
                      <label
                        key={day.value}
                        title={day.label}
                        className={cn(
                          "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-xs font-bold transition",
                          active ? "bg-field-600 text-white" : "bg-panel-100 text-slate-700 hover:bg-panel-200"
                        )}
                      >
                        <input
                          type="checkbox"
                          name="recurrence_weekdays"
                          value={day.value}
                          checked={active}
                          onChange={() => toggleWeekday(day.value)}
                          className="sr-only"
                        />
                        {day.short}
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">Termina em</p>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="radio" name="recurrence_end_type" value="never" checked={endType === "never"} onChange={() => setEndType("never")} className="h-4 w-4" />
                Nunca
              </label>
              <label className="grid gap-3 text-sm text-slate-700 sm:grid-cols-[auto,1fr] sm:items-center">
                <span className="flex items-center gap-3">
                  <input type="radio" name="recurrence_end_type" value="on" checked={endType === "on"} onChange={() => setEndType("on")} className="h-4 w-4" />
                  Em
                </span>
                <DateInput name="recurrence_until" disabled={endType !== "on"} />
              </label>
              <label className="grid gap-3 text-sm text-slate-700 sm:grid-cols-[auto,1fr] sm:items-center">
                <span className="flex items-center gap-3">
                  <input type="radio" name="recurrence_end_type" value="after" checked={endType === "after"} onChange={() => setEndType("after")} className="h-4 w-4" />
                  Após
                </span>
                <div className="flex items-center gap-2">
                  <input name="recurrence_count" type="number" min={1} max={52} defaultValue={13} disabled={endType !== "after"} />
                  <span className="text-sm text-slate-600">ocorrências</span>
                </div>
              </label>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

function localDateFromIso(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
