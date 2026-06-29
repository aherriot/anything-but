// jest-dom matchers only make sense in a DOM (jsdom) environment, and importing
// the package eagerly crashes under the `node` test environment used by the API
// route tests. So load it lazily, only when a DOM is present. (Type support for
// the matchers comes from jest-dom.d.ts, independent of this runtime import.)
if (typeof document !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@testing-library/jest-dom");
}
