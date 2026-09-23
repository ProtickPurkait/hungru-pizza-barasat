import { DAYS, DAY_LABELS, type Day, type OpeningHours } from "@/lib/content/schemas";

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

export function hoursConfigured(hours: OpeningHours) {
  return DAYS.some((d) => hours.days[d].closed || hours.days[d].ranges.length > 0);
}

/** "23:00" → "11 PM", "11:30" → "11:30 AM", "00:00" → "12 AM" */
export function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatDay(day: OpeningHours["days"][Day]) {
  if (day.closed) return "Closed";
  if (day.ranges.length === 0) return "Hours not set";
  return day.ranges.map((r) => `${formatTime(r.open)} – ${formatTime(r.close)}`).join(", ");
}

/** Groups consecutive days with identical hours: [{ label: "Mon – Fri", value: "11 AM – 11 PM" }] */
export function groupedHours(hours: OpeningHours) {
  const rows: { label: string; value: string; days: Day[] }[] = [];
  for (const day of DAYS) {
    const value = formatDay(hours.days[day]);
    const last = rows[rows.length - 1];
    if (last && last.value === value) last.days.push(day);
    else rows.push({ label: "", value, days: [day] });
  }
  const short = (d: Day) => DAY_LABELS[d].slice(0, 3);
  for (const row of rows) {
    row.label =
      row.days.length === 1 ? DAY_LABELS[row.days[0]] : `${short(row.days[0])} – ${short(row.days[row.days.length - 1])}`;
  }
  return rows.filter((r) => r.value !== "Hours not set");
}

/** Weekday + minutes-since-midnight for `date` in the given IANA timezone. */
export function zonedNow(date: Date, timeZone: string): { day: Day; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = get("weekday").toLowerCase().slice(0, 3) as Day;
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export type OpenStatus =
  | { state: "unknown" }
  | { state: "open"; closesAt: string }
  | { state: "closed"; opensAt: { day: Day; time: string; isToday: boolean; isTomorrow: boolean } | null };

/** Works out whether the restaurant is open right now, including ranges that run past midnight. */
export function openStatus(hours: OpeningHours, date = new Date()): OpenStatus {
  if (!hoursConfigured(hours)) return { state: "unknown" };
  const { day, minutes } = zonedNow(date, hours.timezone);
  const index = DAYS.indexOf(day);
  const yesterday = DAYS[(index + 6) % 7];

  // Overnight range from yesterday still running (e.g. 18:00–02:00).
  if (!hours.days[yesterday].closed) {
    for (const r of hours.days[yesterday].ranges) {
      const open = toMinutes(r.open);
      const close = toMinutes(r.close);
      if (close < open && minutes < close) return { state: "open", closesAt: r.close };
    }
  }
  if (!hours.days[day].closed) {
    for (const r of hours.days[day].ranges) {
      const open = toMinutes(r.open);
      const close = toMinutes(r.close);
      const overnight = close < open;
      if (minutes >= open && (overnight || minutes < close)) return { state: "open", closesAt: r.close };
    }
  }

  // Find the next opening time within the coming week.
  for (let offset = 0; offset < 8; offset++) {
    const d = DAYS[(index + offset) % 7];
    if (hours.days[d].closed) continue;
    const upcoming = [...hours.days[d].ranges]
      .map((r) => r.open)
      .sort()
      .find((open) => offset > 0 || toMinutes(open) > minutes);
    if (upcoming) return { state: "closed", opensAt: { day: d, time: upcoming, isToday: offset === 0, isTomorrow: offset === 1 } };
  }
  return { state: "closed", opensAt: null };
}

export function describeOpenStatus(status: OpenStatus) {
  if (status.state === "unknown") return null;
  if (status.state === "open") return { open: true, label: `Open now · until ${formatTime(status.closesAt)}` };
  if (!status.opensAt) return { open: false, label: "Closed" };
  const when = status.opensAt.isToday
    ? formatTime(status.opensAt.time)
    : status.opensAt.isTomorrow
      ? `tomorrow ${formatTime(status.opensAt.time)}`
      : `${DAY_LABELS[status.opensAt.day]} ${formatTime(status.opensAt.time)}`;
  return { open: false, label: `Closed · opens ${when}` };
}
