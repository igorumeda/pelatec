"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CalendarDays, Compass, MapPin, Search, Sparkles, UsersRound } from "lucide-react";
import { updateUserLocationAction } from "@/app/actions";
import { loadGooglePlaces } from "@/components/place-autocomplete-field";
import { DEFAULT_AVATAR_SRC } from "@/components/user-avatar";
import { brl, cn, playerPositionLabel, totalSkillPoints } from "@/lib/utils";

export type ExplorePelada = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  neighborhood: string | null;
  venue: string | null;
  venue_address: string | null;
  venue_lat: number | string | null;
  venue_lng: number | string | null;
  preferred_weekdays: string | null;
  default_time: string | null;
  monthly_fee: number | string | null;
  daily_fee: number | string | null;
  crest_url: string | null;
  banner_url: string | null;
  public_slug: string;
  members_count: number | string;
  scheduled_rounds_count: number | string;
  finished_rounds_count: number | string;
  average_player_quality: number | string | null;
  viewer_status?: "member" | "requested" | null;
};

export type ExplorePlayer = {
  id: string;
  username: string;
  name: string;
  nickname: string | null;
  avatar_url: string | null;
  age: number | null;
  position: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  play_style: string | null;
  player_description: string | null;
  shooting: number;
  dribbling: number;
  passing: number;
  strength: number;
  speed: number;
  defense: number;
  last_lat: number | string | null;
  last_lng: number | string | null;
  last_location_at: string | null;
  peladas_count: number | string;
};

type UserCoords = {
  lat: number;
  lng: number;
};

type LocationSource = "saved" | "browser" | "manual";
type ExploreTab = "peladas" | "players";

type SavedLocationState = {
  coords: UserCoords;
  source: LocationSource;
  message: string;
};

type InitialLocation = {
  last_lat: number | string | null;
  last_lng: number | string | null;
  last_location_at?: string | null;
  last_location_label?: string | null;
  last_location_source?: LocationSource | null;
} | null;

const defaultCrest = "/default-pelada-crest.svg";
const defaultBanner = "/default-pelada-banner.svg";
const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const tabParamByValue: Record<ExploreTab, string> = {
  peladas: "peladas",
  players: "jogadores"
};

const weekdayOptions = [
  ["", "Todos os dias"],
  ["monday", "Segunda"],
  ["tuesday", "Terça"],
  ["wednesday", "Quarta"],
  ["thursday", "Quinta"],
  ["friday", "Sexta"],
  ["saturday", "Sábado"],
  ["sunday", "Domingo"]
];

const positionOptions = [
  ["", "Todas as posições"],
  ["striker", "Atacante"],
  ["midfielder", "Meia"],
  ["fullback", "Lateral"],
  ["center_back", "Zagueiro"],
  ["goalkeeper", "Goleiro"]
];

export function ExploreClient({
  peladas,
  players,
  initialLocation
}: {
  peladas: ExplorePelada[];
  players: ExplorePlayer[];
  initialLocation?: InitialLocation;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = parseTabParam(searchParams.get("tipo"));
  const initialCoords = parseInitialLocation(initialLocation);
  const initialSource = initialLocation?.last_location_source === "manual" ? "manual" : initialCoords ? "saved" : "browser";
  const initialLocationLabel = initialLocation?.last_location_label?.trim();
  const initialMessage = initialCoords
    ? initialLocationLabel
      ? `Resultados ordenados por ${initialLocationLabel}.`
      : "Resultados ordenados pela sua última localização salva."
    : "Use sua localização para ordenar os resultados por proximidade.";
  const [tab, setTab] = useState<ExploreTab>(initialTab);
  const [coords, setCoords] = useState<UserCoords | null>(initialCoords);
  const [locationMessage, setLocationMessage] = useState(initialMessage);
  const [locationSource, setLocationSource] = useState<LocationSource>(initialSource);
  const [savedLocation, setSavedLocation] = useState<SavedLocationState | null>(
    initialCoords ? { coords: initialCoords, source: initialSource, message: initialMessage } : null
  );
  const [manualError, setManualError] = useState("");
  const [showLocationPanel, setShowLocationPanel] = useState(!initialCoords);
  const [isPending, startTransition] = useTransition();

  const [peladaSearch, setPeladaSearch] = useState("");
  const [peladaDay, setPeladaDay] = useState("");
  const [peladaCity, setPeladaCity] = useState("");
  const [peladaMaxDistance, setPeladaMaxDistance] = useState("");

  const [playerSearch, setPlayerSearch] = useState("");
  const [playerPosition, setPlayerPosition] = useState("");
  const [playerStyle, setPlayerStyle] = useState("");
  const [playerMinScore, setPlayerMinScore] = useState("");
  const [playerMaxDistance, setPlayerMaxDistance] = useState("");

  useEffect(() => {
    if (initialCoords) return;
    requestLocation(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTab(parseTabParam(searchParams.get("tipo")));
  }, [searchParams]);

  function changeTab(nextTab: ExploreTab) {
    setTab(nextTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tipo", tabParamByValue[nextTab]);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function saveLocation(nextCoords: UserCoords, message: string, source: LocationSource, label?: string) {
    setCoords(nextCoords);
    setLocationSource(source);
    setLocationMessage(message);
    setSavedLocation({ coords: nextCoords, source, message });
    setManualError("");
    setShowLocationPanel(false);

    startTransition(async () => {
      const response = await updateUserLocationAction({
        ...nextCoords,
        source: source === "manual" ? "manual" : "browser",
        label: label || undefined
      });
      if (!response?.ok) {
        setManualError(response?.message ?? "Não foi possível salvar a localização.");
        setShowLocationPanel(true);
      }
    });
  }

  function restoreSavedLocation(errorMessage: string) {
    if (!savedLocation) {
      setLocationMessage(errorMessage);
      setShowLocationPanel(true);
      return;
    }

    setCoords(savedLocation.coords);
    setLocationSource(savedLocation.source);
    setLocationMessage(savedLocation.message);
    setManualError(errorMessage);
    setShowLocationPanel(false);
  }

  function requestLocation(showErrors = true) {
    if (!navigator.geolocation) {
      if (showErrors) restoreSavedLocation("Seu navegador não oferece geolocalização.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        saveLocation(nextCoords, "Resultados ordenados pela sua localização atual.", "browser");
      },
      () => {
        if (showErrors) {
          restoreSavedLocation("Não foi possível acessar sua localização.");
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 1000 * 60 * 10 }
    );
  }

  const peladaCities = useMemo(
    () => [...new Set(peladas.map((pelada) => pelada.city).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b)),
    [peladas]
  );

  const playerStyles = useMemo(
    () => [...new Set(players.map((player) => player.play_style).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b)),
    [players]
  );

  const visiblePeladas = useMemo(() => {
    return peladas
      .map((pelada) => ({
        ...pelada,
        distanceKm: coords ? distanceFrom(coords, Number(pelada.venue_lat), Number(pelada.venue_lng)) : null
      }))
      .filter((pelada) => matchesSearch([
        pelada.name,
        pelada.description,
        pelada.city,
        pelada.neighborhood,
        pelada.venue,
        pelada.venue_address
      ], peladaSearch))
      .filter((pelada) => !peladaDay || pelada.preferred_weekdays === peladaDay)
      .filter((pelada) => !peladaCity || pelada.city === peladaCity)
      .filter((pelada) => !peladaMaxDistance || (pelada.distanceKm !== null && pelada.distanceKm <= Number(peladaMaxDistance)))
      .sort(byDistanceThenName);
  }, [coords, peladas, peladaCity, peladaDay, peladaMaxDistance, peladaSearch]);

  const visiblePlayers = useMemo(() => {
    return players
      .map((player) => ({
        ...player,
        score: totalSkillPoints(player),
        distanceKm: coords ? distanceFrom(coords, Number(player.last_lat), Number(player.last_lng)) : null
      }))
      .filter((player) => matchesSearch([
        player.name,
        player.nickname,
        player.username,
        player.play_style,
        player.player_description,
        player.position ? playerPositionLabel(player.position) : null
      ], playerSearch))
      .filter((player) => !playerPosition || player.position === playerPosition)
      .filter((player) => !playerStyle || player.play_style === playerStyle)
      .filter((player) => !playerMinScore || player.score >= Number(playerMinScore))
      .filter((player) => !playerMaxDistance || (player.distanceKm !== null && player.distanceKm <= Number(playerMaxDistance)))
      .sort(byDistanceThenName);
  }, [coords, playerMaxDistance, playerMinScore, playerPosition, playerSearch, playerStyle, players]);

  return (
    <div className="mt-5 space-y-5">
      {showLocationPanel ? (
        <div className="rounded-2xl border border-panel-200 bg-panel-100/70 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">Exploração por redondeza</p>
              <p className="mt-1 text-sm text-slate-600">{locationMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => requestLocation(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-field-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-field-600 disabled:opacity-70"
              disabled={isPending}
            >
              <Compass size={16} />
              Usar localização
            </button>
          </div>

          <div className="mt-4 border-t border-panel-200 pt-4">
            <ManualLocationAddressField
              onSelect={(nextCoords, label) => {
                saveLocation(nextCoords, `Resultados ordenados por ${label}.`, "manual", label);
              }}
            />
          </div>
          {manualError ? <p className="mt-2 text-sm font-medium text-red-400">{manualError}</p> : null}
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-panel-200 bg-panel-100/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-slate-900">
              {locationSource === "manual" ? "Localização manual" : "Localização ativa"}
            </p>
            <p className="mt-1 text-sm text-slate-600">{locationMessage}</p>
            {manualError ? <p className="mt-1 text-sm font-medium text-amber-300">{manualError}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => setShowLocationPanel(true)}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-panel-200 bg-panel-50 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-panel-100"
          >
            Alterar localização
          </button>
        </div>
      )}

      <div className="inline-flex rounded-2xl border border-panel-200 bg-white p-1 shadow-sm">
        <TabButton active={tab === "peladas"} onClick={() => changeTab("peladas")}>
          Explorar peladas
        </TabButton>
        <TabButton active={tab === "players"} onClick={() => changeTab("players")}>
          Explorar jogadores
        </TabButton>
      </div>

      {tab === "peladas" ? (
        <div className="space-y-4">
          <FilterPanel>
            <SearchField value={peladaSearch} onChange={setPeladaSearch} placeholder="Pesquisar por nome, local, bairro ou cidade" />
            <select value={peladaDay} onChange={(event) => setPeladaDay(event.target.value)}>
              {weekdayOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select value={peladaCity} onChange={(event) => setPeladaCity(event.target.value)}>
              <option value="">Todas as cidades</option>
              {peladaCities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
            <select value={peladaMaxDistance} onChange={(event) => setPeladaMaxDistance(event.target.value)}>
              <option value="">Qualquer distância</option>
              <option value="5">Até 5 km</option>
              <option value="10">Até 10 km</option>
              <option value="25">Até 25 km</option>
              <option value="50">Até 50 km</option>
            </select>
          </FilterPanel>

          <div className="grid gap-4 lg:grid-cols-2">
            {visiblePeladas.map((pelada) => <PeladaExploreCard key={pelada.id} pelada={pelada} />)}
          </div>
          {!visiblePeladas.length ? <EmptyResults text="Nenhuma pelada encontrada com os filtros atuais." /> : null}
        </div>
      ) : (
        <div className="space-y-4">
          <FilterPanel>
            <SearchField value={playerSearch} onChange={setPlayerSearch} placeholder="Pesquisar por nome, usuário, estilo ou descrição" />
            <select value={playerPosition} onChange={(event) => setPlayerPosition(event.target.value)}>
              {positionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select value={playerStyle} onChange={(event) => setPlayerStyle(event.target.value)}>
              <option value="">Todos os estilos</option>
              {playerStyles.map((style) => <option key={style} value={style}>{style}</option>)}
            </select>
            <select value={playerMinScore} onChange={(event) => setPlayerMinScore(event.target.value)}>
              <option value="">Qualquer pontuação</option>
              <option value="3">3+ pontos</option>
              <option value="5">5+ pontos</option>
              <option value="8">8+ pontos</option>
              <option value="10">10 pontos</option>
            </select>
            <select value={playerMaxDistance} onChange={(event) => setPlayerMaxDistance(event.target.value)}>
              <option value="">Qualquer distância</option>
              <option value="5">Até 5 km</option>
              <option value="10">Até 10 km</option>
              <option value="25">Até 25 km</option>
              <option value="50">Até 50 km</option>
            </select>
          </FilterPanel>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visiblePlayers.map((player) => <PlayerExploreCard key={player.id} player={player} />)}
          </div>
          {!visiblePlayers.length ? <EmptyResults text="Nenhum jogador encontrado com os filtros atuais." /> : null}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
        active ? "bg-field-600 text-white" : "text-slate-700 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}

function FilterPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-panel-200 bg-panel-100/70 p-3 md:grid-cols-2 xl:grid-cols-5">
      {children}
    </div>
  );
}

function ManualLocationAddressField({
  onSelect
}: {
  onSelect: (coords: UserCoords, label: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [displayValue, setDisplayValue] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!mapsApiKey) {
      setMessage("Busca por endereço indisponível. Configure a chave do Google Maps ou use latitude e longitude.");
      return;
    }

    loadGooglePlaces(mapsApiKey)
      .then(() => setLoaded(true))
      .catch(() => setMessage("Não foi possível carregar a busca por endereço. Use latitude e longitude."));
  }, []);

  useEffect(() => {
    if (!loaded || !inputRef.current || !window.google?.maps?.places?.Autocomplete) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "br" },
      fields: ["formatted_address", "geometry", "name"]
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const lat = place.geometry?.location?.lat?.();
      const lng = place.geometry?.location?.lng?.();
      const label = place.formatted_address || place.name || "localização manual";

      if (typeof lat !== "number" || typeof lng !== "number") {
        setMessage("Selecione uma opção válida da lista do Google Maps.");
        return;
      }

      setDisplayValue(label);
      setSelectedAddress(label);
      setMessage("");
      onSelect({ lat, lng }, label);
    });

    return () => {
      listener?.remove?.();
    };
  }, [loaded, onSelect]);

  const disabled = !mapsApiKey || !loaded;

  return (
    <div className="space-y-2">
      <label className="block space-y-1 text-sm font-semibold text-slate-700">
        Definir por endereço
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border border-panel-200 bg-panel-50 px-3.5 py-2.5 text-sm text-slate-900 focus-within:border-field-500 focus-within:ring-4 focus-within:ring-field-100/70",
            disabled && "opacity-70"
          )}
        >
          <Search size={16} className="shrink-0 text-slate-500" />
          <input
            ref={inputRef}
            value={displayValue}
            onChange={(event) => {
              setDisplayValue(event.target.value);
              setSelectedAddress("");
            }}
            disabled={disabled}
            placeholder={mapsApiKey ? "Busque por rua, bairro, cidade ou ponto de referência" : "Google Maps não configurado"}
            autoComplete="off"
            className="border-0 bg-transparent p-0 shadow-none focus:ring-0"
          />
        </div>
      </label>
      {selectedAddress ? (
        <p className="flex items-start gap-2 text-xs text-slate-600">
          <MapPin size={14} className="mt-0.5 shrink-0 text-field-700" />
          <span>Localização selecionada: {selectedAddress}</span>
        </p>
      ) : null}
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-panel-200 bg-panel-50 px-3.5 py-2.5 text-sm text-slate-900 focus-within:border-field-500 focus-within:ring-4 focus-within:ring-field-100/70">
      <Search size={16} className="shrink-0 text-slate-500" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="border-0 bg-transparent p-0 shadow-none focus:ring-0"
      />
    </div>
  );
}

function PeladaExploreCard({ pelada }: { pelada: ExplorePelada & { distanceKm: number | null } }) {
  const bannerSrc = pelada.banner_url || defaultBanner;
  const crestSrc = pelada.crest_url || defaultCrest;
  const location = [pelada.venue_address ?? pelada.venue, pelada.neighborhood, pelada.city].filter(Boolean).join(" - ");
  const href = `/pelada/${pelada.public_slug}`;

  return (
    <Link href={href} className="group overflow-hidden rounded-[28px] border border-panel-200 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-panel">
      <div className="relative min-h-56">
        <Image src={bannerSrc} alt={`Banner da pelada ${pelada.name}`} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/50 to-brand-950/10" />
        {pelada.viewer_status ? (
          <span className="absolute right-4 top-4 rounded-full border border-white/20 bg-brand-950/70 px-3 py-1.5 text-xs font-semibold text-slate-100 shadow-sm backdrop-blur">
            {pelada.viewer_status === "member" ? "Você participa" : "Solicitação enviada"}
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="flex items-end gap-4">
            <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white/25 bg-white shadow-2xl">
              <Image src={crestSrc} alt={`Brasão da pelada ${pelada.name}`} fill sizes="80px" className="object-cover" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-2xl font-extrabold text-white">{pelada.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-100">{pelada.description || location || "Pelada pública no Pelatec"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <InfoChip icon={MapPin} label={pelada.distanceKm !== null ? `${pelada.distanceKm.toFixed(1)} km de você` : location || "Local não informado"} />
        <InfoChip icon={UsersRound} label={`${pelada.members_count} jogadores`} />
        <InfoChip icon={CalendarDays} label={`${pelada.scheduled_rounds_count} rodadas agendadas`} />
        <InfoChip icon={Sparkles} label={`Qualidade ${Number(pelada.average_player_quality ?? 0).toFixed(1)}/10`} />
      </div>
      <div className="flex flex-wrap gap-2 px-4 pb-4 text-xs text-slate-600">
        {pelada.default_time ? <span className="rounded-full bg-slate-100 px-2.5 py-1">Horário {String(pelada.default_time).slice(0, 5)}</span> : null}
        {pelada.preferred_weekdays ? <span className="rounded-full bg-slate-100 px-2.5 py-1">{weekdayLabel(pelada.preferred_weekdays)}</span> : null}
        <span className="rounded-full bg-field-50 px-2.5 py-1 text-field-700">Mensal {brl(pelada.monthly_fee)}</span>
        <span className="rounded-full bg-field-50 px-2.5 py-1 text-field-700">Diária {brl(pelada.daily_fee)}</span>
      </div>
    </Link>
  );
}

function PlayerExploreCard({ player }: { player: ExplorePlayer & { score: number; distanceKm: number | null } }) {
  const displayName = player.nickname || player.name;

  return (
    <Link
      href={`/${player.username}`}
      className="group overflow-hidden rounded-[28px] border border-cyan-300/15 bg-[radial-gradient(circle_at_top,_rgba(35,209,170,0.22),_transparent_42%),linear-gradient(145deg,_#171244_0%,_#0e1831_62%,_#08111f_100%)] p-4 shadow-2xl transition hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-100/80">Jogador</p>
          <h3 className="mt-1 line-clamp-1 text-xl font-extrabold text-white">{displayName}</h3>
          <p className="text-sm text-slate-300">@{player.username}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-center">
          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-100/80">Geral</p>
          <p className="text-3xl font-black text-white">{player.score}</p>
        </div>
      </div>

      <div className="relative mx-auto mt-5 h-40 w-40 overflow-hidden rounded-full border-4 border-cyan-200/25 bg-white/8 shadow-2xl">
        <Image
          src={player.avatar_url || DEFAULT_AVATAR_SRC}
          alt={`Foto de ${displayName}`}
          fill
          sizes="160px"
          unoptimized={!player.avatar_url}
          className="object-cover object-top"
        />
      </div>

      <div className="mt-5 space-y-2 rounded-3xl border border-white/10 bg-[#091120]/65 p-4">
        <PlayerFact label="Posição" value={player.position ? playerPositionLabel(player.position) : "Não informada"} />
        <PlayerFact label="Estilo" value={player.play_style || "Não informado"} />
        <PlayerFact label="Peladas" value={String(player.peladas_count)} />
        <PlayerFact label="Distância" value={player.distanceKm !== null ? `${player.distanceKm.toFixed(1)} km` : "Sem localização"} />
      </div>
    </Link>
  );
}

function InfoChip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
      <Icon size={16} className="shrink-0 text-field-700" />
      <span className="line-clamp-1">{label}</span>
    </div>
  );
}

function PlayerFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 last:border-0 last:pb-0">
      <span className="text-xs uppercase tracking-[0.16em] text-slate-300">{label}</span>
      <span className="text-right text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function EmptyResults({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-panel-200 bg-panel-100/75 p-8 text-center text-sm text-slate-600">
      {text}
    </div>
  );
}

function parseInitialLocation(location?: InitialLocation) {
  const lat = Number(location?.last_lat);
  const lng = Number(location?.last_lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function parseTabParam(value: string | null): ExploreTab {
  return value === "jogadores" || value === "players" ? "players" : "peladas";
}

function matchesSearch(values: Array<string | null | undefined>, search: string) {
  const normalizedSearch = normalize(search);
  if (!normalizedSearch) return true;
  return values.some((value) => normalize(value ?? "").includes(normalizedSearch));
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function distanceFrom(origin: UserCoords, lat: number, lng: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const radiusKm = 6371;
  const dLat = toRadians(lat - origin.lat);
  const dLng = toRadians(lng - origin.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(origin.lat)) * Math.cos(toRadians(lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return value * Math.PI / 180;
}

function byDistanceThenName<T extends { distanceKm: number | null; name: string }>(a: T, b: T) {
  if (a.distanceKm !== null && b.distanceKm === null) return -1;
  if (a.distanceKm === null && b.distanceKm !== null) return 1;
  if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
  return a.name.localeCompare(b.name);
}

function weekdayLabel(value: string) {
  return weekdayOptions.find(([key]) => key === value)?.[1] ?? value;
}
