export function canPost(
  me: { role: string; verificationStatus: string; status?: string } | null | undefined,
) {
  if (!me || me.status === "PAUSED" || me.status === "SUSPENDED") return false;
  return me.role === "HOST" || me.role === "MODERATOR" || me.role === "ADMIN" || me.verificationStatus === "VERIFIED";
}
