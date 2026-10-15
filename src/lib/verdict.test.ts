import { describe, expect, it } from "vitest";
import { determineVerdict } from "./verdict";

describe("determineVerdict", () => {
  it("proves only when targets pass and no regressions exist", () => {
    expect(determineVerdict({ checkConclusion: "success", expectedFailures: ["a"], passingAfter: ["a"], newFailures: [] })).toBe("PROVEN");
  });
  it("refuses a green claim when a regression appears", () => {
    expect(determineVerdict({ checkConclusion: "success", expectedFailures: ["a"], passingAfter: ["a"], newFailures: ["b"] })).toBe("NOT_PROVEN");
  });
  it("returns error on timeout", () => {
    expect(determineVerdict({ timedOut: true, expectedFailures: [], passingAfter: [], newFailures: [] })).toBe("ERROR");
  });
  it("refuses proof when no failing baseline was observed", () => {
    expect(determineVerdict({ checkConclusion: "success", baselineObserved: false, expectedFailures: ["a"], passingAfter: ["a"], newFailures: [] })).toBe("NOT_PROVEN");
  });
});
