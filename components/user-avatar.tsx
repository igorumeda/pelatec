import Image from "next/image";
import { cn } from "@/lib/utils";

export const DEFAULT_AVATAR_SRC = "/default-player-avatar.svg";

export function UserAvatar({
  src,
  name,
  size = 44,
  className
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={src || DEFAULT_AVATAR_SRC}
      alt={`Foto de ${name}`}
      width={size}
      height={size}
      unoptimized
      className={cn("rounded-full object-cover", className)}
    />
  );
}
