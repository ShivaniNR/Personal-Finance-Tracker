import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getDateRange } from "../dateRanges";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

describe("getDateRange", () => {
  beforeEach(() => {
    // Pin "today" to 2026-05-15 so range math is deterministic.
    // Fake only Date (not timers) to avoid interfering with the worker.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 4, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns YYYY-MM-DD formatted start and end dates", () => {
    const { startDate, endDate } = getDateRange("this_month");
    expect(startDate).toMatch(ISO_DATE);
    expect(endDate).toMatch(ISO_DATE);
  });

  it("this_month spans the first to the last day of the current month", () => {
    expect(getDateRange("this_month")).toEqual({
      startDate: "2026-05-01",
      endDate: "2026-05-31",
    });
  });

  it("last_month spans the previous calendar month", () => {
    expect(getDateRange("last_month")).toEqual({
      startDate: "2026-04-01",
      endDate: "2026-04-30",
    });
  });

  it("last_3_months starts two months back and ends at month end", () => {
    expect(getDateRange("last_3_months")).toEqual({
      startDate: "2026-03-01",
      endDate: "2026-05-31",
    });
  });

  it("last_6_months crosses the year boundary correctly", () => {
    expect(getDateRange("last_6_months")).toEqual({
      startDate: "2025-12-01",
      endDate: "2026-05-31",
    });
  });

  it("falls back to this_month for an unknown range key", () => {
    expect(getDateRange("nonsense")).toEqual(getDateRange("this_month"));
  });

  it("never returns a start date after the end date", () => {
    for (const { value } of [
      { value: "this_month" },
      { value: "last_month" },
      { value: "last_3_months" },
      { value: "last_6_months" },
    ]) {
      const { startDate, endDate } = getDateRange(value);
      expect(startDate <= endDate).toBe(true);
    }
  });
});
