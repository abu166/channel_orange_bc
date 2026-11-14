import { describe, expect, it } from "vitest";
import { validateAddress, visitCharge } from "../lib/visit";
import { PLANS, SERVICES } from "../lib/pricing";
import { generateSlots, serviceArea, toICS, type Booking } from "../lib/booking";

const address = { line1: "123 Example St", city: "Austin", state: "TX", zip: "78701" };
describe("home skin visits", () => {
  it("charges a monthly plan payment instead of marking a plan visit free", () => {
    for (const id of ["skin", "whole"]) {
      const plan = PLANS.find(p => p.id === id)!;
      expect(visitCharge(id)).toEqual({ price: plan.monthly, planId: id, label: `${plan.name} · $${plan.monthly}/month · ${plan.commitment} ($${plan.annual} total)` });
    }
    expect(visitCharge("payg").price).toBe(SERVICES.home_skin.price);
    expect(visitCharge("lab").planId).toBeNull();
  });
  it("accepts valid addresses and trims fields", () => {
    expect(validateAddress(address)).toEqual({});
    expect(validateAddress({ ...address, state: " tx ", zip: " 78701 " })).toEqual({});
  });
  it("reports each missing field", () => {
    expect(Object.keys(validateAddress({ line1: " ", city: "", state: "", zip: "" }))).toEqual(["line1", "city", "state", "zip"]);
  });
  it("rejects invalid state codes and ZIP formats", () => {
    for (const state of ["Texas", "ZZ", "T1"]) expect(validateAddress({ ...address, state }).state).toBeTruthy();
    for (const zip of ["7870", "787011", "ABCDE", "78701-1234"]) expect(validateAddress({ ...address, zip }).zip).toBeTruthy();
  });
  it("checks pilot coverage", () => {
    expect(serviceArea("78701")).toBe("Austin, TX");
    expect(serviceArea("60601")).toBeNull();
  });
  it("offers no Sunday home visits", () => {
    const days = generateSlots("home_skin", 21, new Date(2026, 10, 14));
    expect(days.length).toBeGreaterThan(0);
    for (const day of days) for (const slot of day.slots) expect(new Date(slot).getDay()).not.toBe(0);
  });
  it("exports the requested time and address to calendar", () => {
    const booking: Booking = { id: "example", created_at: "2026-11-14T10:00:00Z", kind: "home_skin", slot_iso: "2026-11-16T15:00:00Z", duration_min: 45, price_usd: 129, plan_id: null, contact: { name: "Example", phone: "5125550100", email: "example@example.com" }, address: { ...address, access_notes: "" }, details: {}, status: "requested" };
    expect(toICS(booking)).toContain("DTSTART:20261116T150000Z");
    expect(toICS(booking)).toContain("LOCATION:123 Example St\\, Austin\\, TX 78701");
  });
});
