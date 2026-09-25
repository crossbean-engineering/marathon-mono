import ExcelJS from 'exceljs';
import { BaseParticipant, ParticipantAddOnSummary } from '@marathon/core';
import { describeAddOn } from '@marathon-api/app/addOn';

// Column widths are set explicitly so the sheet is readable without the user
// having to resize anything.
const COLUMNS: Partial<ExcelJS.Column>[] = [
  { header: 'Code', key: 'code', width: 18 },
  { header: 'Runner No.', key: 'runnerNumber', width: 12 },
  { header: 'Name', key: 'name', width: 26 },
  { header: 'IC', key: 'ic', width: 20 },
  { header: 'Gender', key: 'gender', width: 10 },
  { header: 'Vest Size', key: 'shirtSize', width: 12 },
  { header: 'Status', key: 'status', width: 12 },
  { header: 'Package', key: 'packageName', width: 24 },
  { header: 'Package Price (GHS)', key: 'packagePrice', width: 20 },
  { header: 'Package Benefits', key: 'packageBenefits', width: 34 },
  { header: 'Accommodation', key: 'accommodation', width: 34 },
  { header: 'Transport', key: 'transport', width: 24 },
  { header: 'Add-ons (GHS)', key: 'addOnTotal', width: 16 },
  { header: 'Wristband Code', key: 'wristbandCode', width: 20 },
  { header: 'Registered At', key: 'createdAt', width: 22 },
  { header: 'Checked In At', key: 'checkinDate', width: 22 },
];

export async function participantsToXlsx(
  participants: BaseParticipant[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Participants');
  sheet.columns = COLUMNS;

  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  for (const participant of participants) {
    const addOns = participant.addOns ?? [];
    const ofType = (type: ParticipantAddOnSummary['type']) =>
      addOns.filter((a) => a.type === type).map(describeAddOn).join(', ');
    sheet.addRow({
      code: participant.code,
      runnerNumber: participant.runnerNumber ?? '',
      name: participant.name,
      ic: participant.ic ?? '',
      gender: participant.gender ?? '',
      shirtSize: participant.shirtSize ?? '',
      status: participant.status,
      packageName: participant.package?.name ?? '',
      // Written as a number so Excel can total it; pesewas -> GHS.
      packagePrice:
        participant.package != null ? participant.package.price / 100 : null,
      packageBenefits: participant.package?.benefits ?? '',
      accommodation: ofType('accommodation'),
      transport: ofType('transport'),
      addOnTotal: addOns.length
        ? addOns.reduce((sum, a) => sum + a.price, 0) / 100
        : null,
      wristbandCode: participant.wristbandCode ?? '',
      createdAt: new Date(participant.createdAt),
      checkinDate: participant.checkinDate
        ? new Date(participant.checkinDate)
        : null,
    });
  }

  sheet.getColumn('packagePrice').numFmt = '#,##0.00';
  sheet.getColumn('addOnTotal').numFmt = '#,##0.00';
  sheet.getColumn('createdAt').numFmt = 'yyyy-mm-dd hh:mm';
  sheet.getColumn('checkinDate').numFmt = 'yyyy-mm-dd hh:mm';

  // Codes and IC numbers are identifiers, not numbers — keep them as text so
  // Excel does not strip leading zeros or reformat them.
  sheet.getColumn('code').alignment = { horizontal: 'left' };
  sheet.getColumn('ic').alignment = { horizontal: 'left' };
  sheet.getColumn('wristbandCode').alignment = { horizontal: 'left' };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
