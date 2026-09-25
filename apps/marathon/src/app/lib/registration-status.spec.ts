// PACKAGE_SALES_OPEN is read once at module load, so each case loads a fresh
// copy with the env it needs.
function loadWith(value: string | undefined) {
  if (value === undefined) delete process.env['VITE_PACKAGE_SALES_OPEN'];
  else process.env['VITE_PACKAGE_SALES_OPEN'] = value;
  let mod: typeof import('./registration-status') | undefined;
  jest.isolateModules(() => {
    mod = jest.requireActual('./registration-status');
  });
  return mod!;
}

afterEach(() => {
  delete process.env['VITE_PACKAGE_SALES_OPEN'];
});

describe('PACKAGE_SALES_OPEN', () => {
  it('is open by default — registration for Western City Run is live', () => {
    expect(loadWith(undefined).PACKAGE_SALES_OPEN).toBe(true);
  });

  it('closes sales when built with VITE_PACKAGE_SALES_OPEN=false', () => {
    expect(loadWith('false').PACKAGE_SALES_OPEN).toBe(false);
  });

  it('stays open for any other value', () => {
    expect(loadWith('true').PACKAGE_SALES_OPEN).toBe(true);
  });
});
