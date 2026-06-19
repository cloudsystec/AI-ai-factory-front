import assert from "node:assert/strict";
import test from "node:test";
import {
  formatAiProviderLabel,
  formatBotModeLabel,
} from "./aiProviderLabels.js";

test("formatAiProviderLabel oculta cursor como Online", () => {
  assert.equal(formatAiProviderLabel("cursor"), "Online");
  assert.equal(formatAiProviderLabel("CURSOR"), "Online");
  assert.equal(formatAiProviderLabel("luna"), "Luna");
});

test("formatBotModeLabel reutiliza rótulos de provedor", () => {
  assert.equal(formatBotModeLabel("cursor"), "Online");
  assert.equal(formatBotModeLabel("luna"), "Luna");
});
