"use client";

import { useEffect, useState } from "react";

type DateInputProps = {
  name: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
};

export function DateInput({ name, value, defaultValue = "", required, disabled, onChange }: DateInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [displayValue, setDisplayValue] = useState(isoToBrDate(value ?? defaultValue));
  const isoValue = value ?? internalValue;

  useEffect(() => {
    if (value !== undefined) setDisplayValue(isoToBrDate(value));
  }, [value]);

  function handleChange(nextDisplay: string) {
    const masked = maskDate(nextDisplay);
    setDisplayValue(masked);
    const nextIso = brDateToIso(masked);
    if (value === undefined) setInternalValue(nextIso);
    onChange?.(nextIso);
  }

  return (
    <>
      <input
        type="text"
        value={displayValue}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="DD/MM/AAAA"
        inputMode="numeric"
        maxLength={10}
        required={required}
        disabled={disabled}
        aria-label="Data no formato DD/MM/AAAA"
      />
      <input type="hidden" name={name} value={disabled ? "" : isoValue} />
    </>
  );
}

export function todayIsoDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isoToBrDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function brDateToIso(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return "";
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function maskDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
