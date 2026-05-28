import { describe, it, expect } from "vitest";
import { getDateRange } from "../dateRanges";

describe("getDateRange", () => {
    it("returns start and end dates for this_month", () => {
        const result = getDateRange("this_month");

        expect(result).toHaveProperty("startDate");
        expect(result).toHaveProperty("endDate");
    })
});