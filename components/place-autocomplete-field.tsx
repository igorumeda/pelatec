"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Field } from "@/components/ui";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: any;
    __googleMapsPlacesPromise?: Promise<void>;
  }
}

type PlaceAutocompleteFieldProps = {
  defaultName?: string | null;
  defaultAddress?: string | null;
  defaultPlaceId?: string | null;
  defaultLat?: number | string | null;
  defaultLng?: number | string | null;
};

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function PlaceAutocompleteField({
  defaultName,
  defaultAddress,
  defaultPlaceId,
  defaultLat,
  defaultLng
}: PlaceAutocompleteFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState({
    venue: defaultName ?? "",
    venue_address: defaultAddress ?? "",
    venue_place_id: defaultPlaceId ?? "",
    venue_lat: defaultLat ? String(defaultLat) : "",
    venue_lng: defaultLng ? String(defaultLng) : ""
  });
  const [displayValue, setDisplayValue] = useState(defaultAddress || defaultName || "");
  const [touchedWithoutSelection, setTouchedWithoutSelection] = useState(false);

  useEffect(() => {
    if (!mapsApiKey) return;

    loadGooglePlaces(mapsApiKey)
      .then(() => setLoaded(true))
      .catch(() => setLoaded(false));
  }, []);

  useEffect(() => {
    if (!loaded || !inputRef.current || !window.google?.maps?.places?.Autocomplete) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "br" },
      fields: ["formatted_address", "geometry", "name", "place_id"]
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const lat = place.geometry?.location?.lat?.();
      const lng = place.geometry?.location?.lng?.();
      const name = place.name || place.formatted_address || "";
      const address = place.formatted_address || name;

      setSelected({
        venue: name,
        venue_address: address,
        venue_place_id: place.place_id || "",
        venue_lat: typeof lat === "number" ? String(lat) : "",
        venue_lng: typeof lng === "number" ? String(lng) : ""
      });
      setDisplayValue(address);
      setTouchedWithoutSelection(false);
    });

    return () => {
      listener?.remove?.();
    };
  }, [loaded]);

  const hasPlace = Boolean(selected.venue_place_id || selected.venue_address);
  const disabled = !mapsApiKey || !loaded;

  return (
    <Field label="Local">
      <div className="space-y-2">
        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl border border-panel-200 bg-white/75 px-3 py-2 text-slate-900 shadow-sm focus-within:border-field-500 focus-within:ring-2 focus-within:ring-field-500/20",
            disabled && "opacity-70"
          )}
        >
          <Search size={17} className="shrink-0 text-slate-500" />
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={displayValue}
            disabled={disabled}
            placeholder={mapsApiKey ? "Busque pelo nome ou endereco no Google Maps" : "Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"}
            autoComplete="off"
            className="border-0 bg-transparent p-0 shadow-none focus:ring-0"
            onChange={(event) => {
              setDisplayValue(event.target.value);
              setTouchedWithoutSelection(true);
              setSelected({
                venue: "",
                venue_address: "",
                venue_place_id: "",
                venue_lat: "",
                venue_lng: ""
              });
            }}
          />
        </div>

        {hasPlace ? (
          <p className="flex items-start gap-2 text-xs text-slate-600">
            <MapPin size={14} className="mt-0.5 shrink-0 text-field-700" />
            <span>Local selecionado: {selected.venue_address || selected.venue}</span>
          </p>
        ) : null}

        {touchedWithoutSelection && !disabled ? (
          <p className="text-xs font-medium text-amber-700">Selecione uma opcao da lista do Google Maps para salvar o local.</p>
        ) : null}

        {!mapsApiKey ? (
          <p className="text-xs text-slate-600">Adicione a chave do Google Maps no `.env.local` para habilitar a busca de locais reais.</p>
        ) : null}

        <input type="hidden" name="venue" value={selected.venue} />
        <input type="hidden" name="venue_address" value={selected.venue_address} />
        <input type="hidden" name="venue_place_id" value={selected.venue_place_id} />
        <input type="hidden" name="venue_lat" value={selected.venue_lat} />
        <input type="hidden" name="venue_lng" value={selected.venue_lng} />
      </div>
    </Field>
  );
}

export function loadGooglePlaces(apiKey: string) {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (window.__googleMapsPlacesPromise) return window.__googleMapsPlacesPromise;

  window.__googleMapsPlacesPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-google-places='true']");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Maps não carregou.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=pt-BR&region=BR`;
    script.async = true;
    script.defer = true;
    script.dataset.googlePlaces = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps não carregou."));
    document.head.appendChild(script);
  });

  return window.__googleMapsPlacesPromise;
}
