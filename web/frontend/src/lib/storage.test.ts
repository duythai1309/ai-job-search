import assert from "node:assert/strict";
import test from "node:test";
import { buildStorageKey } from "./storage.ts";

test("builds user-scoped localStorage keys", () => {
  assert.equal(buildStorageKey("user-a", "profile"), "vica:user-a:profile");
  assert.equal(buildStorageKey(null, "applications"), "vica:demo-user:applications");
});

test("keeps two users isolated", () => {
  assert.notEqual(
    buildStorageKey("user-a", "savedJobs"),
    buildStorageKey("user-b", "savedJobs")
  );
});
