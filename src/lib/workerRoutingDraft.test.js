import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildWorkerTenantPatch,
  resolveRowSource,
  collectMapRowKeys,
  normalizeRoute,
  routesEqual,
} from "./workerRoutingDraft.js";

describe("workerRoutingDraft", () => {
  const global = {
    defaultProvider: "luna",
    defaultProfile: "planning",
    byJobKind: { develop: { provider: "luna", lunaProfile: "coding" } },
    byAgentName: { Dev: { provider: "luna", lunaProfile: "coding" } },
    byAgentFile: { "agents/dev.md": { provider: "luna", lunaProfile: "coding" } },
  };

  it("buildWorkerTenantPatch envia null para remover override tenant", () => {
    const draft = {};
    const global = {
      defaultProvider: "luna",
      defaultProfile: "planning",
      byJobKind: { develop: { provider: "luna", lunaProfile: "coding" } },
    };
    const prev = {
      byJobKind: { develop: { provider: "cursor" } },
    };
    const patch = buildWorkerTenantPatch(draft, global, prev);
    assert.equal(patch.byJobKind.develop, null);
    assert.equal(patch.byJobKind?.task, undefined);
  });

  it("buildWorkerTenantPatch preserva outro override ao remover um", () => {
    const draft = {
      byJobKind: { task: { provider: "luna", lunaProfile: "fast" } },
    };
    const global = {
      defaultProvider: "luna",
      defaultProfile: "planning",
      byJobKind: { develop: { provider: "luna", lunaProfile: "coding" } },
    };
    const prev = {
      byJobKind: {
        develop: { provider: "cursor" },
        task: { provider: "luna", lunaProfile: "fast" },
      },
    };
    const patch = buildWorkerTenantPatch(draft, global, prev);
    assert.equal(patch.byJobKind.develop, null);
    assert.equal(patch.byJobKind?.task, undefined);
  });

  it("buildWorkerTenantPatch inclui rota cursor diferente do global", () => {
    const draft = {
      defaultProvider: "luna",
      defaultProfile: "planning",
      byJobKind: {
        develop: { provider: "cursor" },
      },
    };
    const patch = buildWorkerTenantPatch(draft, global, {});
    assert.deepEqual(patch.byJobKind.develop, { provider: "cursor" });
    assert.equal(patch.byJobKind?.task, undefined);
  });

  it("routesEqual compara cursor e luna", () => {
    assert.equal(
      routesEqual({ provider: "cursor" }, { provider: "cursor" }),
      true
    );
    assert.equal(
      routesEqual(
        { provider: "luna", lunaProfile: "fast" },
        { provider: "luna", lunaProfile: "coding" }
      ),
      false
    );
  });

  it("normalizeRoute aceita string legacy", () => {
    assert.deepEqual(normalizeRoute("coding"), {
      provider: "luna",
      lunaProfile: "coding",
    });
    assert.deepEqual(normalizeRoute("cursor"), { provider: "cursor" });
  });

  it("collectMapRowKeys une catálogo draft e global", () => {
    const keys = collectMapRowKeys(
      [{ key: "develop", label: "Dev" }],
      { byJobKind: { custom: { provider: "luna", lunaProfile: "fast" } } },
      global,
      "byJobKind"
    );
    assert.ok(keys.includes("develop"));
    assert.ok(keys.includes("custom"));
  });
});
