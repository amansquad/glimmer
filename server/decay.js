// A note's "brightness" halves every HALF_LIFE_DAYS since it was last viewed or edited.
// Revisiting a note resets its clock, so actively-used knowledge stays lit while
// forgotten notes fade toward the background — the whole point of Glimmer.
const HALF_LIFE_DAYS = 10;

export function brightnessOf(lastViewedAtIso, now = new Date()) {
  const lastViewed = new Date(lastViewedAtIso);
  const daysSince = (now - lastViewed) / (1000 * 60 * 60 * 24);
  const brightness = Math.pow(0.5, daysSince / HALF_LIFE_DAYS);
  return Math.max(0.05, Math.min(1, brightness));
}
