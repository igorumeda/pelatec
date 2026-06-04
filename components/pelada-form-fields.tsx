"use client";

import { useEffect, useState } from "react";
import { ImageUp, Link2 } from "lucide-react";
import { Field } from "@/components/ui";
import { type Pelada } from "@/lib/types";

const maxAssetSizeMb = 5;
const maxAssetSizeBytes = maxAssetSizeMb * 1024 * 1024;
const defaultCrest = "/default-pelada-crest.svg";
const defaultBanner = "/default-pelada-banner.svg";

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
      setAsset({ preview: null, name: null, error: `A imagem deve ter no maximo ${maxAssetSizeMb} MB.` });
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
          <Field label="Descricao">
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
          <Field label="Local">
            <input name="venue" defaultValue={pelada?.venue ?? ""} />
          </Field>
        </div>
        <Field label="Dias preferenciais">
          <input name="preferred_weekdays" placeholder="Ex.: tercas e quintas" defaultValue={pelada?.preferred_weekdays ?? ""} />
        </Field>
        <Field label="Horario padrao">
          <input name="default_time" type="time" defaultValue={pelada?.default_time?.slice(0, 5) ?? ""} />
        </Field>
        <Field label="Valor mensalista">
          <input name="monthly_fee" type="number" step="0.01" min="0" defaultValue={pelada?.monthly_fee ?? ""} />
        </Field>
        <Field label="Valor diarista">
          <input name="daily_fee" type="number" step="0.01" min="0" defaultValue={pelada?.daily_fee ?? ""} />
        </Field>
        {pelada?.id ? (
          <Field label="Status">
            <select name="status" defaultValue={pelada?.status ?? "active"}>
              <option value="active">Ativa</option>
              <option value="inactive">Inativa</option>
            </select>
          </Field>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.75fr,1.25fr]">
        <AssetPicker
          label="Brasao da pelada"
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
            <span className="block font-semibold text-slate-900">Pelada publica</span>
            <span className="mt-1 block text-sm text-slate-600">
              Quando ativada, qualquer pessoa podera ver a pagina publica da pelada pela URL definida abaixo.
            </span>
          </span>
        </label>
        <div className="mt-4">
          <Field label="Nome da URL publica">
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
          <p className="mt-2 text-xs text-slate-500">Use letras minusculas, numeros e hifen. Esse nome precisa ser unico.</p>
        </div>
      </div>

      {!pelada?.id ? <input type="hidden" name="status" value="active" /> : null}
    </div>
  );
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
          {state.name ? `Arquivo selecionado: ${state.name}` : `JPG, PNG ou WebP ate ${maxAssetSizeMb} MB.`}
        </span>
        {state.error ? <span className="text-center text-sm font-medium text-red-600">{state.error}</span> : null}
        <input name={name} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onChange} />
      </label>
    </Field>
  );
}
