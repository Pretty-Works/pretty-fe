import assert from "node:assert/strict";
import test from "node:test";

import { resolveAllowedExternalUrl } from "./externalUrl.ts";

const origin = "https://agent.example.com";

test("accepts an HTTPS URL from the configured OAuth origin", () => {
  assert.equal(
    resolveAllowedExternalUrl(
      "https://agent.example.com/oauth/google/start?request=abc",
      origin,
    ),
    "https://agent.example.com/oauth/google/start?request=abc",
  );
});

test("rejects missing, malformed, and HTTP URLs", () => {
  assert.equal(resolveAllowedExternalUrl(undefined, origin), null);
  assert.equal(resolveAllowedExternalUrl("not-a-url", origin), null);
  assert.equal(resolveAllowedExternalUrl("http://agent.example.com/oauth", origin), null);
});

test("rejects lookalike hosts and unconfigured origins", () => {
  assert.equal(
    resolveAllowedExternalUrl("https://agent.example.com.evil.test/oauth", origin),
    null,
  );
  assert.equal(
    resolveAllowedExternalUrl("https://agent.example.com/oauth", ""),
    null,
  );
});
