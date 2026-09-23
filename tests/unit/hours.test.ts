import { describe, expect, it } from "vitest";
import { hoursSchema } from "@/lib/content/schemas";
import { describeOpenStatus, formatTime, groupedHours, hoursConfigured, openStatus } from "@/lib/hours";

// 2026-09-21 is a Monday. IST = UTC+05:30.
const ist = (date: string, time: string) => new Date(`${date}T${time}:00+05:30`);

const hours = hoursSchema.parse({
  days: {
    mon: { ranges: [{ open: "11:00", close: "23:00" }] },
    tue: { ranges: [{ open: "11:00", close: "23:00" }] },
    wed: { closed: true },
    thu: { ranges: [{ open: "11:00", close: "15:00" }, { open: "18:00", close: "23:00" }] },
    fri: { ranges: [{ open: "18:00", close: "02:00" }] },
    sat: { ranges: [{ open: "18:00", close: "02:00" }] },
    sun: { ranges: [{ open: "12:00", close: "22:00" }] },
  },
});

describe("formatTime", () => {
  it("formats 24-hour times for people", () => {
    expect(formatTime("23:00")).toBe("11 PM");
    expect(formatTime("00:00")).toBe("12 AM");
    expect(formatTime("11:30")).toBe("11:30 AM");
  });
});

describe("openStatus", () => {
  it("is unknown when no hours are set", () => {
    expect(openStatus(hoursSchema.parse({})).state).toBe("unknown");
    expect(hoursConfigured(hoursSchema.parse({}))).toBe(false);
  });
  it("detects open hours", () => {
    expect(openStatus(hours, ist("2026-09-21", "12:00"))).toEqual({ state: "open", closesAt: "23:00" });
  });
  it("handles ranges that run past midnight", () => {
    // Saturday 01:30 is still Friday night's 18:00–02:00 shift.
    expect(openStatus(hours, ist("2026-09-26", "01:30"))).toEqual({ state: "open", closesAt: "02:00" });
    expect(openStatus(hours, ist("2026-09-25", "23:30"))).toEqual({ state: "open", closesAt: "02:00" });
  });
  it("handles split shifts", () => {
    expect(openStatus(hours, ist("2026-09-24", "16:00"))).toMatchObject({ state: "closed", opensAt: { time: "18:00", isToday: true } });
  });
  it("skips closed days when finding the next opening", () => {
    const s = openStatus(hours, ist("2026-09-22", "23:30"));
    expect(s).toMatchObject({ state: "closed", opensAt: { day: "thu", time: "11:00" } });
    expect(describeOpenStatus(s)?.label).toBe("Closed · opens Thursday 11 AM");
  });
});

describe("groupedHours", () => {
  it("groups consecutive identical days", () => {
    expect(groupedHours(hours)[0]).toMatchObject({ label: "Mon – Tue", value: "11 AM – 11 PM" });
    expect(groupedHours(hours)[1]).toMatchObject({ label: "Wednesday", value: "Closed" });
  });
});
