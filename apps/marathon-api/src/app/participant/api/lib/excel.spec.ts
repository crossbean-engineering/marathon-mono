import ExcelJS from 'exceljs';
import { BaseParticipant } from '@marathon/core';

// excel.ts pulls describeAddOn from the add-on module, whose use cases import
// the database client.
jest.mock('@marathon-api/core', () => ({ db: {} }));

import { participantsToXlsx } from './excel';

const participant = (overrides: Partial<BaseParticipant> = {}): BaseParticipant => ({
  id: 'participant-1',
  name: 'Runner One',
  code: 'CODE1',
  status: 'active',
  packageId: 'pkg-10k',
  package: { id: 'pkg-10k', name: '10KM Run', price: 12000, benefits: null },
  userId: 'user-1',
  createdAt: '2026-09-25T10:00:00.000Z',
  ...overrides,
});

async function readSheet(participants: BaseParticipant[]) {
  const workbook = new ExcelJS.Workbook();
  const buffer = await participantsToXlsx(participants);
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.getWorksheet('Participants')!;
  const headers = (sheet.getRow(1).values as unknown[]).slice(1) as string[];
  const cell = (row: number, header: string) =>
    sheet.getRow(row).getCell(headers.indexOf(header) + 1).value;
  return { headers, cell };
}

describe('participantsToXlsx', () => {
  it('has Weekend Package columns and labels sizes as vest sizes', async () => {
    const { headers } = await readSheet([]);
    expect(headers).toEqual(
      expect.arrayContaining(['Vest Size', 'Accommodation', 'Transport', 'Add-ons (GHS)']),
    );
    expect(headers).not.toContain('Shirt Size');
  });

  it('writes booked accommodation and transport with their total in GHS', async () => {
    const { cell } = await readSheet([
      participant({
        addOns: [
          {
            addOnId: 'kod-double',
            type: 'accommodation',
            name: 'Double room',
            provider: 'KOD Apartment',
            occupancy: 2,
            price: 22500,
          },
          {
            addOnId: 'return-bus',
            type: 'transport',
            name: 'Return group transport',
            price: 25000,
          },
        ],
      }),
    ]);

    expect(cell(2, 'Accommodation')).toBe('KOD Apartment — Double room (2 sharing)');
    expect(cell(2, 'Transport')).toBe('Return group transport');
    expect(cell(2, 'Add-ons (GHS)')).toBe(475);
  });

  it('leaves the add-on columns empty for a race-only registration', async () => {
    const { cell } = await readSheet([participant({ addOns: [] })]);

    expect(cell(2, 'Accommodation')).toBeFalsy();
    expect(cell(2, 'Transport')).toBeFalsy();
    expect(cell(2, 'Add-ons (GHS)')).toBeNull();
  });
});
