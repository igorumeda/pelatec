import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  variant?: "full" | "icon";
  theme?: "light" | "dark";
};

export function BrandLogo({ className, variant = "icon", theme = "dark" }: BrandLogoProps) {
  const primary = "#10B981";
  const accent = "#FBBF24";
  const ink = theme === "dark" ? "#FFFFFF" : "#0F1F3A";

  if (variant === "icon") {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("h-10 w-10", className)}>
        <circle cx="50" cy="50" r="48" fill={primary} />
        <path d="M 30 50 Q 50 30, 70 50 T 30 50" stroke="#0F1F3A" strokeWidth="2" fill="none" opacity="0.22" />
        <circle cx="35" cy="35" r="4" fill="white" />
        <circle cx="65" cy="35" r="4" fill="white" />
        <circle cx="50" cy="55" r="4" fill="white" />
        <circle cx="35" cy="70" r="4" fill={accent} />
        <circle cx="65" cy="70" r="4" fill={accent} />
        <line x1="35" y1="35" x2="50" y2="55" stroke="white" strokeWidth="2" opacity="0.65" />
        <line x1="65" y1="35" x2="50" y2="55" stroke="white" strokeWidth="2" opacity="0.65" />
        <line x1="50" y1="55" x2="35" y2="70" stroke={accent} strokeWidth="2" opacity="0.9" />
        <line x1="50" y1="55" x2="65" y2="70" stroke={accent} strokeWidth="2" opacity="0.9" />
        <path d="M 50 48 L 48 52 L 44 50" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 360 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("h-10 w-auto", className)}>
      <circle cx="45" cy="45" r="41" fill={primary} />
      <circle cx="31" cy="31" r="3.5" fill="white" />
      <circle cx="59" cy="31" r="3.5" fill="white" />
      <circle cx="45" cy="50" r="3.5" fill="white" />
      <circle cx="31" cy="64" r="3.5" fill={accent} />
      <circle cx="59" cy="64" r="3.5" fill={accent} />
      <line x1="31" y1="31" x2="45" y2="50" stroke="white" strokeWidth="2" opacity="0.65" />
      <line x1="59" y1="31" x2="45" y2="50" stroke="white" strokeWidth="2" opacity="0.65" />
      <line x1="45" y1="50" x2="31" y2="64" stroke={accent} strokeWidth="2" opacity="0.9" />
      <line x1="45" y1="50" x2="59" y2="64" stroke={accent} strokeWidth="2" opacity="0.9" />
      <text x="100" y="58" fill={ink} fontSize="40" fontWeight="800" fontFamily="Inter, system-ui, sans-serif">
        Pelatec
      </text>
    </svg>
  );
}
