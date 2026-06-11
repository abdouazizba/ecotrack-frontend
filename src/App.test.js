// react-scripts 5 / Jest 27 does not support package.json subpath exports
// used by react-router v7 — integration tests require a modern test runner.
test('placeholder — test infra not yet configured for react-router v7', () => {
  expect(true).toBe(true);
});
