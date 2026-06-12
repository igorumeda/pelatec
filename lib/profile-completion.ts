type ProfileCompletionInput = {
  name?: string | null;
  username?: string | null;
  position?: string | null;
  shooting?: number | string | null;
  dribbling?: number | string | null;
  passing?: number | string | null;
  strength?: number | string | null;
  speed?: number | string | null;
  defense?: number | string | null;
} | null | undefined;

export function isProfileComplete(profile: ProfileCompletionInput) {
  if (!profile?.name?.trim() || !profile.username?.trim() || !profile.position) return false;

  const total =
    Number(profile.shooting ?? 0) +
    Number(profile.dribbling ?? 0) +
    Number(profile.passing ?? 0) +
    Number(profile.strength ?? 0) +
    Number(profile.speed ?? 0) +
    Number(profile.defense ?? 0);

  return total === 10;
}
