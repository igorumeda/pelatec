"use client";

import { useEffect, useState } from "react";
import { ImageUp, Link2 } from "lucide-react";
import { PlaceAutocompleteField } from "@/components/place-autocomplete-field";
import { Field } from "@/components/ui";
import { type Pelada } from "@/lib/types";

const maxAssetSizeMb = 5;
const maxAssetSizeBytes = maxAssetSizeMb * 1024 * 1024;
const defaultCrest = "/default-pelada-crest.svg";
const defaultBanner = "/default-pelada-banner.svg";
const weekdays = [
  { value: "", label: "Selecione" },
  { value: "monday", label: "Segunda-feira" },
  { value: "tuesday", label: "Terça-feira" },
  { value: "wednesday", label: "Quarta-feira" },
  { value: "thursday", label: "Quinta-feira" },
  { value: "friday", label: "Sexta-feira" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" }
];

type AssetState = {
  preview: string | null;
  name: string | null;
  error: string | null;
};

const emptyAssetState: AssetState = {
  preview: null,
  name: null,
  error: null
};

export function PeladaFormFields({ pelada }: { pelada?: Partial<Pelada> | null }) {
  const [crest, setCrest] = useState<AssetState>(emptyAssetState);
  const [banner, setBanner] = useState<AssetState>(emptyAssetState);

  useEffect(() => {
    return () => {
      if (crest.preview) URL.revokeObjectURL(crest.preview);
      if (banner.preview) URL.revokeObjectURL(banner.preview);
    };
  }, [crest.preview, banner.preview]);

  function handleAssetChange(
    event: React.ChangeEvent<HTMLInputElement>,
    current: AssetState,
    setAsset: React.Dispatch<React.SetStateAction<AssetState>>
  ) {
    const file = event.target.files?.[0] ?? null;
    if (current.preview) URL.revokeObjectURL(current.preview);

    setAsset(emptyAssetState);

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      event.target.value = "";
      setAsset({ preview: null, name: null, error: "Selecione uma imagem em JPG, PNG ou WebP." });
      return;
    }

    if (file.size > maxAssetSizeBytes) {
      event.target.value = "";
      setAsset({ preview: null, name: null, error: `A imagem deve ter no máximo ${maxAssetSizeMb} MB.` });
      return;
    }

    setAsset({
      preview: URL.createObjectURL(file),
      name: file.name,
      error: null
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Nome">
            <input name="name" required defaultValue={pelada?.name ?? ""} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Descrição">
            <textarea name="description" rows={3} defaultValue={pelada?.description ?? ""} />
          </Field>
        </div>
        <Field label="Cidade">
          <input name="city" defaultValue={pelada?.city ?? ""} />
        </Field>
        <Field label="Bairro">
          <input name="neighborhood" defaultValue={pelada?.neighborhood ?? ""} />
        </Field>
        <div className="sm:col-span-2">
          <PlaceAutocompleteField
            defaultName={pelada?.venue}
            defaultAddress={pelada?.venue_address}
            defaultPlaceId={pelada?.venue_place_id}
            defaultLat={pelada?.venue_lat}
            defaultLng={pelada?.venue_lng}
          />
        </div>
        <Field label="Dia preferencial">
          <select name="preferred_weekdays" defaultValue={pelada?.preferred_weekdays ?? ""}>
            {weekdays.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
            {pelada?.preferred_weekdays && !weekdays.some((day) => day.value === pelada.preferred_weekdays) ? (
              <option value={pelada.preferred_weekdays}>{pelada.preferred_weekdays}</option>
            ) : null}
          </select>
        </Field>
        <Field label="Horário padrão">
          <input name="default_time" type="time" step="60" defaultValue={pelada?.default_time?.slice(0, 5) ?? ""} />
        </Field>
        <CurrencyField label="Valor mensalista" name="monthly_fee" defaultValue={pelada?.monthly_fee} />
        <CurrencyField label="Valor diarista" name="daily_fee" defaultValue={pelada?.daily_fee} />
        {pelada?.id ? (
          <StatusFlag defaultStatus={pelada?.status ?? "active"} />
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.75fr,1.25fr]">
        <AssetPicker
          label="Brasão da pelada"
          name="crest"
          currentUrl={pelada?.crest_url}
          defaultUrl={defaultCrest}
          state={crest}
          onChange={(event) => handleAssetChange(event, crest, setCrest)}
          shape="round"
        />
        <AssetPicker
          label="Banner da pelada"
          name="banner"
          currentUrl={pelada?.banner_url}
          defaultUrl={defaultBanner}
          state={banner}
          onChange={(event) => handleAssetChange(event, banner, setBanner)}
          shape="banner"
        />
      </div>

      <input type="hidden" name="crest_url" value={pelada?.crest_url ?? ""} />
      <input type="hidden" name="banner_url" value={pelada?.banner_url ?? ""} />

      <div className="rounded-3xl border border-panel-200 bg-panel-50/85 p-4">
        <label className="flex items-start gap-3">
          <input
            name="is_public"
            type="checkbox"
            defaultChecked={Boolean(pelada?.is_public)}
            className="mt-1 h-5 w-5 rounded border-panel-300 text-field-600"
          />
          <span>
            <span className="block font-semibold text-slate-900">Pelada pública</span>
            <span className="mt-1 block text-sm text-slate-600">
              Quando ativada, qualquer pessoa poderá ver a página pública da pelada pela URL definida abaixo.
            </span>
          </span>
        </label>
        <div className="mt-4">
          <Field label="Nome da URL pública">
            <div className="flex items-center gap-2 rounded-2xl border border-panel-200 bg-white/70 px-3 py-2">
              <Link2 size={16} className="shrink-0 text-slate-500" />
              <span className="hidden text-sm text-slate-500 sm:inline">/pelada/</span>
              <input
                name="public_slug"
                defaultValue={pelada?.public_slug ?? ""}
                placeholder="minha-pelada"
                className="border-0 bg-transparent p-0 shadow-none focus:ring-0"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
          </Field>
          <p className="mt-2 text-xs text-slate-500">Use letras minúsculas, números e hífen. Esse nome precisa ser único.</p>
        </div>
      </div>

      {!pelada?.id ? <input type="hidden" name="status" value="active" /> : null}
    </div>
  );
}

function CurrencyField({
  label,
  name,
  defaultValue
}: {
  label: string;
  name: string;
  defaultValue?: number | string | null;
}) {
  const initialAmount = parseCurrencyValue(defaultValue);
  const [amount, setAmount] = useState(initialAmount);

  return (
    <Field label={label}>
      <div className="flex items-center gap-2 rounded-xl border border-panel-200 bg-panel-50 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus-within:border-field-500 focus-within:ring-4 focus-within:ring-field-100/70">
        <span className="shrink-0 font-semibold text-slate-600">R$</span>
        <input
          type="text"
          inputMode="numeric"
          value={amount ? formatCurrencyDisplay(amount) : ""}
          placeholder="0,00"
          className="border-0 bg-transparent p-0 shadow-none focus:ring-0"
          onChange={(event) => setAmount(currencyDigitsToDecimal(event.target.value))}
        />
        <input type="hidden" name={name} value={amount} />
      </div>
    </Field>
  );
}

function StatusFlag({ defaultStatus }: { defaultStatus: "active" | "inactive" }) {
  const [active, setActive] = useState(defaultStatus === "active");

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-slate-700">Status</span>
      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-panel-200 bg-panel-50 px-3.5 py-2.5">
        <input type="hidden" name="status" value="inactive" />
        <input
          name="status"
          type="checkbox"
          value="active"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
          className="sr-only"
        />
        <span className="text-sm font-semibold text-slate-800">{active ? "Ativa" : "Inativa"}</span>
        <span className={`relative h-6 w-11 rounded-full transition ${active ? "bg-field-500" : "bg-slate-300"}`}>
          <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${active ? "left-6" : "left-1"}`} />
        </span>
      </label>
    </div>
  );
}

function parseCurrencyValue(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "";
}

function currencyDigitsToDecimal(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return (Number(digits) / 100).toFixed(2);
}

function formatCurrencyDisplay(value: string) {
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function AssetPicker({
  label,
  name,
  currentUrl,
  defaultUrl,
  state,
  onChange,
  shape
}: {
  label: string;
  name: string;
  currentUrl?: string | null;
  defaultUrl: string;
  state: AssetState;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  shape: "round" | "banner";
}) {
  const src = state.preview || currentUrl || defaultUrl;

  return (
    <Field label={label}>
      <label className="flex cursor-pointer flex-col gap-3 rounded-3xl border border-dashed border-panel-300 bg-panel-50/85 p-4 text-sm text-slate-600 transition hover:border-brand-700/35 hover:bg-white/80">
        <span
          className={
            shape === "round"
              ? "relative mx-auto h-32 w-32 overflow-hidden rounded-full border border-panel-200 bg-white shadow-sm"
              : "relative aspect-[16/7] w-full overflow-hidden rounded-2xl border border-panel-200 bg-white shadow-sm"
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={label} className="h-full w-full object-cover" />
        </span>
        <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-950 px-3 py-2 text-xs font-semibold text-white">
          <ImageUp size={15} />
          Escolher imagem
        </span>
        <span className="text-center">
          {state.name ? `Arquivo selecionado: ${state.name}` : `JPG, PNG ou WebP até ${maxAssetSizeMb} MB.`}
        </span>
        {state.error ? <span className="text-center text-sm font-medium text-red-600">{state.error}</span> : null}
        <input name={name} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onChange} />
      </label>
    </Field>
  );
}
