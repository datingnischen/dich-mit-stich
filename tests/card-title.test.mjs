import assert from "node:assert/strict";
import test from "node:test";

const { MAX_CARD_LINK_TEXT, splitCardTitle } = await import("../lib/card-title.ts");

test("long card titles link only their head (Seobility: Linktext zur Seite ist zu lang)", () => {
  assert.deepEqual(
    splitCardTitle("Floral Sleeve Tattoo – Rosen und Blätter – fein schattiert, besonders harmonisch als Full Sleeve"),
    ["Floral Sleeve Tattoo", "Rosen und Blätter – fein schattiert, besonders harmonisch als Full Sleeve"],
  );
  assert.ok(MAX_CARD_LINK_TEXT <= 60);
});

test("short titles and titles without a dash stay one link", () => {
  assert.deepEqual(splitCardTitle("Pascal & Stephanie – Eine Liebesgeschichte"), ["Pascal & Stephanie – Eine Liebesgeschichte", null]);
  const noDash = "Ein sehr langer Titel ohne Gedankenstrich, der trotzdem vollständig als Link stehen bleibt";
  assert.deepEqual(splitCardTitle(noDash), [noDash, null]);
});
