import { cn } from "@/lib/utils";

/**
 * Variantes illustratives pour la carte météo Voyage.
 * Mapping présentation uniquement — aucune logique métier.
 */
export type WeatherIconKind =
  | "clear-day"
  | "clear-night"
  | "partly-cloudy-day"
  | "partly-cloudy-night"
  | "cloudy"
  | "overcast"
  | "drizzle"
  | "rain"
  | "showers"
  | "thunder"
  | "snow"
  | "fog";

const OWM_MAP: Record<string, WeatherIconKind> = {
  "01d": "clear-day",
  "01n": "clear-night",
  "02d": "partly-cloudy-day",
  "02n": "partly-cloudy-night",
  "03d": "cloudy",
  "03n": "cloudy",
  "04d": "overcast",
  "04n": "overcast",
  "09d": "showers",
  "09n": "showers",
  "10d": "rain",
  "10n": "rain",
  "11d": "thunder",
  "11n": "thunder",
  "13d": "snow",
  "13n": "snow",
  "50d": "fog",
  "50n": "fog",
};

/** Codes WMO (Open-Meteo) → variante illustrée. */
export function weatherKindFromWmo(code: number): WeatherIconKind {
  if (code === 0) return "clear-day";
  if (code === 1) return "partly-cloudy-day";
  if (code === 2) return "partly-cloudy-day";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "showers";
  if (code === 85 || code === 86) return "snow";
  if (code >= 95 && code <= 99) return "thunder";
  return "cloudy";
}

/** Prévisions journalières : forcer les variantes jour (pas de lune). */
export function preferDayVariant(kind: WeatherIconKind): WeatherIconKind {
  if (kind === "clear-night") return "clear-day";
  if (kind === "partly-cloudy-night") return "partly-cloudy-day";
  return kind;
}

/**
 * Résout la variante depuis `iconId` (OWM `01d` ou code WMO `"61"`)
 * et éventuellement `condition.code`.
 */
export function resolveWeatherIconKind(
  iconId: string | null | undefined,
  code?: number | null,
  options?: { preferDay?: boolean },
): WeatherIconKind {
  const raw = (iconId ?? "").trim().toLowerCase();
  let kind: WeatherIconKind = "cloudy";

  if (raw in OWM_MAP) {
    kind = OWM_MAP[raw]!;
  } else {
    // Codes WMO numériques uniquement (éviter Number("01d") === 1)
    if (/^\d+$/.test(raw)) {
      kind = weatherKindFromWmo(Number(raw));
    } else if (code != null && Number.isFinite(code)) {
      kind = weatherKindFromWmo(code);
    }
  }

  return options?.preferDay ? preferDayVariant(kind) : kind;
}

type Props = {
  iconId?: string | null;
  code?: number | null;
  description?: string | null;
  className?: string;
  /** Desktop cible ~40px ; mobile ~34px via classes. */
  size?: number;
  /** true pour les colonnes journalières (bandeau Voyage). */
  preferDay?: boolean;
};

export function WeatherConditionIcon({
  iconId,
  code,
  description,
  className,
  size = 40,
  preferDay = false,
}: Props) {
  const kind = resolveWeatherIconKind(iconId, code, { preferDay });
  const label = description?.trim() || "Condition météo";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center drop-shadow-[0_2px_6px_rgba(15,23,42,0.08)]",
        className,
      )}
      role="img"
      aria-label={label}
      data-weather-icon={kind}
      data-testid="weather-condition-icon"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="overflow-visible"
      >
        <WeatherGlyph kind={kind} />
      </svg>
    </span>
  );
}

function WeatherGlyph({ kind }: { kind: WeatherIconKind }) {
  switch (kind) {
    case "clear-day":
      return <ClearDay />;
    case "clear-night":
      return <ClearNight />;
    case "partly-cloudy-day":
      return <PartlyCloudyDay />;
    case "partly-cloudy-night":
      return <PartlyCloudyNight />;
    case "cloudy":
      return <Cloudy />;
    case "overcast":
      return <Overcast />;
    case "drizzle":
      return <Drizzle />;
    case "rain":
      return <Rain />;
    case "showers":
      return <Showers />;
    case "thunder":
      return <Thunder />;
    case "snow":
      return <Snow />;
    case "fog":
      return <Fog />;
    default:
      return <Cloudy />;
  }
}

function ClearDay() {
  return (
    <g>
      <circle cx="24" cy="24" r="18" fill="#FEF3C7" opacity="0.55" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 24 + Math.cos(rad) * 13;
        const y1 = 24 + Math.sin(rad) * 13;
        const x2 = 24 + Math.cos(rad) * 18.5;
        const y2 = 24 + Math.sin(rad) * 18.5;
        return (
          <line
            key={deg}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#F59E0B"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        );
      })}
      <circle cx="24" cy="24" r="9.5" fill="#FBBF24" />
      <circle cx="24" cy="24" r="7.2" fill="#FCD34D" />
      <circle cx="21.5" cy="21.5" r="2.2" fill="#FEF3C7" opacity="0.7" />
    </g>
  );
}

function ClearNight() {
  return (
    <g>
      <circle cx="24" cy="24" r="18" fill="#EFF6FF" opacity="0.9" />
      <circle cx="13" cy="14" r="1.3" fill="#60A5FA" />
      <circle cx="37" cy="17" r="1" fill="#93C5FD" />
      <circle cx="14" cy="33" r="0.9" fill="#93C5FD" opacity="0.85" />
      <circle cx="29" cy="20" r="10" fill="#93C5FD" opacity="0.35" />
      <path
        d="M31.5 11.2c-1.3-.45-2.7-.7-4.2-.7-6.5 0-11.8 5.3-11.8 11.8S21 34.1 27.3 34.1c1.5 0 2.9-.25 4.2-.7-3.5-1.6-6-5.1-6-9.15 0-4.1 2.5-7.6 6-9.05z"
        fill="#60A5FA"
      />
      <path
        d="M31.5 11.2c-1.3-.45-2.7-.7-4.2-.7-6.5 0-11.8 5.3-11.8 11.8S21 34.1 27.3 34.1c1.5 0 2.9-.25 4.2-.7-3.5-1.6-6-5.1-6-9.15 0-4.1 2.5-7.6 6-9.05z"
        fill="#BFDBFE"
        opacity="0.55"
      />
    </g>
  );
}

function SoftCloud({
  cx = 24,
  cy = 26,
  scale = 1,
  fill = "#94A3B8",
  soft = "#E2E8F0",
}: {
  cx?: number;
  cy?: number;
  scale?: number;
  fill?: string;
  soft?: string;
}) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale}) translate(-24 -24)`}>
      <ellipse cx="16" cy="26" rx="9.5" ry="7" fill={fill} />
      <ellipse cx="26" cy="23" rx="12" ry="9" fill={soft} />
      <ellipse cx="35" cy="27" rx="8" ry="6.5" fill={fill} opacity="0.92" />
      <ellipse cx="24" cy="29" rx="14" ry="7" fill={soft} />
    </g>
  );
}

function PartlyCloudyDay() {
  return (
    <g>
      <circle cx="33" cy="15" r="7.5" fill="#FBBF24" />
      <circle cx="33" cy="15" r="5.5" fill="#FCD34D" />
      <line
        x1="33"
        y1="4"
        x2="33"
        y2="7"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="42"
        y1="15"
        x2="45"
        y2="15"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="40"
        y1="8"
        x2="42.2"
        y2="10.2"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <SoftCloud cy={30} scale={0.92} fill="#94A3B8" soft="#F1F5F9" />
    </g>
  );
}

function PartlyCloudyNight() {
  return (
    <g>
      <path
        d="M36 10c-1-.3-2-.5-3.1-.5-4.7 0-8.5 3.8-8.5 8.5s3.8 8.5 8.5 8.5c1.1 0 2.1-.2 3.1-.5-2.6-1.2-4.4-3.8-4.4-6.9 0-3.1 1.8-5.8 4.4-7.1z"
        fill="#60A5FA"
      />
      <SoftCloud cy={31} scale={0.92} fill="#94A3B8" soft="#F1F5F9" />
    </g>
  );
}

function Cloudy() {
  return (
    <g>
      <SoftCloud cy={22} scale={0.88} fill="#A8B4C4" soft="#E8EEF5" />
      <SoftCloud cy={28} fill="#8090A5" soft="#D5DEE9" />
    </g>
  );
}

function Overcast() {
  return (
    <g>
      <SoftCloud cy={18} scale={0.85} fill="#8B9AAE" soft="#C5D0DC" />
      <SoftCloud cy={27} fill="#6B7C90" soft="#A8B6C6" />
    </g>
  );
}

function RainDrops({
  color = "#3B82F6",
  y = 35,
}: {
  color?: string;
  y?: number;
}) {
  return (
    <g stroke={color} strokeWidth="2.2" strokeLinecap="round">
      <line x1="16" y1={y} x2="13.5" y2={y + 6} />
      <line x1="24" y1={y + 1.5} x2="21.5" y2={y + 7.5} />
      <line x1="32" y1={y} x2="29.5" y2={y + 6} />
    </g>
  );
}

function Drizzle() {
  return (
    <g>
      <SoftCloud cy={22} fill="#94A3B8" soft="#E2E8F0" />
      <g stroke="#7DD3FC" strokeWidth="1.8" strokeLinecap="round">
        <line x1="17" y1="33" x2="15.5" y2="37" />
        <line x1="24" y1="34" x2="22.5" y2="38" />
        <line x1="31" y1="33" x2="29.5" y2="37" />
      </g>
    </g>
  );
}

function Rain() {
  return (
    <g>
      <SoftCloud cy={20} fill="#64748B" soft="#94A3B8" />
      <RainDrops color="#3B82F6" y={33} />
    </g>
  );
}

function Showers() {
  return (
    <g>
      <circle cx="34" cy="12" r="5.5" fill="#FBBF24" />
      <circle cx="34" cy="12" r="3.8" fill="#FCD34D" />
      <SoftCloud cy={22} fill="#64748B" soft="#94A3B8" />
      <RainDrops color="#60A5FA" y={34} />
    </g>
  );
}

function Thunder() {
  return (
    <g>
      <SoftCloud cy={18} fill="#64748B" soft="#94A3B8" />
      <path
        d="M26.5 25 L20.5 34.5 H26 L22.5 43 L35 30.5 H28.5 L32 25 Z"
        fill="#F59E0B"
      />
      <path
        d="M26.5 25 L20.5 34.5 H26 L22.5 43 L35 30.5 H28.5 L32 25 Z"
        fill="#FDE68A"
        opacity="0.45"
      />
    </g>
  );
}

function Snow() {
  return (
    <g>
      <SoftCloud cy={20} fill="#94A3B8" soft="#F1F5F9" />
      <g fill="#93C5FD">
        <circle cx="16" cy="34" r="2" />
        <circle cx="24" cy="36.5" r="2.2" />
        <circle cx="32" cy="34" r="1.9" />
        <circle cx="20" cy="40" r="1.5" />
        <circle cx="28.5" cy="40.5" r="1.6" />
      </g>
      <g stroke="#BFDBFE" strokeWidth="1.3" strokeLinecap="round">
        <line x1="16" y1="32" x2="16" y2="36" />
        <line x1="14" y1="34" x2="18" y2="34" />
        <line x1="24" y1="34.3" x2="24" y2="38.7" />
        <line x1="22" y1="36.5" x2="26" y2="36.5" />
      </g>
    </g>
  );
}

function Fog() {
  return (
    <g>
      <circle cx="24" cy="24" r="16" fill="#F1F5F9" />
      <g stroke="#94A3B8" strokeWidth="2.6" strokeLinecap="round">
        <line x1="11" y1="17" x2="37" y2="17" />
        <line x1="13" y1="23.5" x2="35" y2="23.5" opacity="0.8" />
        <line x1="11" y1="30" x2="33" y2="30" />
        <line x1="15" y1="36.5" x2="31" y2="36.5" opacity="0.75" />
      </g>
    </g>
  );
}
