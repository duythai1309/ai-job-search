import assert from "node:assert/strict";
import test from "node:test";
import {
  canApplyToJob,
  extractErrorMessage,
  normalizeJob,
  normalizeJobList,
} from "./contracts.ts";

const liveJob = {
  id: "job-1",
  source: "topcv",
  title: "Frontend Developer",
  company: "Vica",
  skills: ["React", "TypeScript"],
  apply_url: "https://example.com/apply",
  is_seeded: false,
  availability_status: "available",
};

test("normalizes backend job skills and apply_url", () => {
  const job = normalizeJob(liveJob);
  assert.deepEqual(job.skills_required, ["React", "TypeScript"]);
  assert.equal(job.url, "https://example.com/apply");
  assert.equal(canApplyToJob(job), true);
});

test("missing apply_url never produces an actionable link", () => {
  const job = normalizeJob({
    ...liveJob,
    apply_url: null,
    is_seeded: true,
    availability_status: "sample",
  });
  assert.equal(job.url, undefined);
  assert.equal(canApplyToJob(job), false);
});

test("rejects malformed job responses", () => {
  assert.throws(() => normalizeJobList([{ id: "missing-required-fields" }]), /missing source/);
});

test("extracts nested API error messages", () => {
  assert.equal(
    extractErrorMessage({ error: { code: "bad_request", message: "Invalid request" } }, "Fallback"),
    "Invalid request"
  );
  assert.equal(extractErrorMessage("Plain failure", "Fallback"), "Plain failure");
});
