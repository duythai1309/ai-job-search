# Task 002: CV Upload and Extraction

## Goal

Implement the first usable user flow for uploading a CV and extracting structured content.

## Scope

- Accept a CV upload
- Support PDF first; other formats require a later additive task
- Extract text from the uploaded PDF
- Produce a normalized CV structure
- Store the minimum necessary metadata
- Expose create, read, and delete behavior through the documented CV API
- Provide a minimal upload and extraction-result UI

## Out of Scope

- Job discovery
- Fit scoring
- Recommendation generation
- Cover letters

## Acceptance Criteria

- The system accepts at least one supported CV file type
- The initial supported type is PDF with documented size limits
- The extracted output is structured and validated
- The system handles messy or incomplete CVs without crashing
- Raw CV content, signed URLs, and user-entered filenames are absent from logs
- Deleting a CV removes the stored upload and derived records

## Likely Files

- Future FastAPI upload endpoint files
- Future CV parsing module files
- Future storage and validation modules
- Future Next.js CV upload page and API client files

## Test Expectations

- Upload success path test
- Invalid file type test
- Malformed CV content test
- PII-safe logging test
- Auth ownership and deletion test
- Minimal UI upload success and error-state test
