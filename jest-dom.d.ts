// Type-only augmentation for jest-dom matchers (toBeInTheDocument, etc.).
// The runtime extension is loaded conditionally in jest.setup.ts; this keeps
// the matcher types available to TypeScript without a runtime import.
import "@testing-library/jest-dom";
