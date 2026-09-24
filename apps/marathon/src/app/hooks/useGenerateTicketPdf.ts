import { useState } from 'react';
import { AwesomeQR } from 'awesome-qr';
import type { BaseParticipant, BasePackage } from '@ak-marathon/sdk';

type GenerateTicketPdfOptions = {
  participant: BaseParticipant;
  pkg?: BasePackage;
};

// `benefits` arrives as a free-text blob of "- Label: value" lines with
// hard-wrapped continuations — mirrors PackageBenefits.tsx's parser so the
// PDF reads the same as the on-screen card.
function parseBenefits(raw: string): string[] {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const items: string[] = [];
  for (const line of lines) {
    if (/^-\s*/.test(line)) {
      items.push(line.replace(/^-\s*/, ''));
    } else if (items.length > 0) {
      items[items.length - 1] += ` ${line}`;
    } else {
      items.push(line);
    }
  }
  return items;
}

// jsPDF's base14 fonts (Helvetica/Courier, WinAnsi encoding) can't render
// arrows, curly quotes, em/en dashes, or emoji. Package benefits text in
// particular tends to describe routes with "→" arrows — hitting one of
// these mid-string doesn't just drop that one glyph, it corrupts the
// character-width table jsPDF uses for the *rest* of that text() call,
// which is what produced the letter-by-letter spacing and off-page overflow
// seen in testing. Every piece of backend-sourced text must go through this
// before being handed to jsPDF.
function sanitizeText(input: string): string {
  return input
    .replace(/[→⇒➡]/g, '->')
    .replace(/[←⇐⬅]/g, '<-')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/[•●▪]/g, '-')
    // Anything else outside basic printable ASCII gets dropped rather than
    // risking another silent encoding corruption.
    .replace(/[^\x20-\x7E]/g, '');
}

const formatMoney = (pesewas: number) => `GHS ${(pesewas / 100).toLocaleString()}`;
const medalLabel = (position?: number | null) =>
  position === 1 ? '1st' : position === 2 ? '2nd' : position === 3 ? '3rd' : 'Prize';

export const useGenerateTicketPdf = () => {
  const [loading, setLoading] = useState(false);

  const generateQrDataUrl = async (text: string): Promise<string> => {
    const qr = new AwesomeQR({
      text,
      size: 400,
      margin: 8,
      correctLevel: 1,
      components: {
        data: { scale: 0.8 },
        timing: { scale: 0.8 },
        alignment: { scale: 0.8 },
      },
    });
    const dataUrl = (await qr.draw()) ?? '';
    return dataUrl.toString();
  };

  const generatePDF = async ({ participant, pkg }: GenerateTicketPdfOptions) => {
    setLoading(true);
    try {
      const { default: jsPDF } = await import('jspdf');

      const doc = new jsPDF({ orientation: 'portrait', format: 'a4', unit: 'pt' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const cx = pageW / 2;
      const margin = 56;
      const lx = margin;
      const rx = pageW - margin;
      const bottomLimit = pageH - margin;

      const emerald = [6, 78, 59] as const;
      const gold = [217, 180, 60] as const;
      const ink = [26, 26, 26] as const;
      const muted = [110, 110, 118] as const;
      const separator = [210, 210, 210] as const;

      // Starts a fresh page (with margin reset) if the next block wouldn't fit.
      let y = 0;
      const ensureSpace = (needed: number) => {
        if (y + needed > bottomLimit) {
          doc.addPage();
          y = margin;
        }
      };

      const isRedeemed = !!participant.wristbandCode;
      const codeValue = participant.wristbandCode ?? participant.code;
      const statusLabel = isRedeemed ? 'ACTIVE' : participant.status.toUpperCase();
      const participantName = sanitizeText(participant.name);
      const packageName = pkg ? sanitizeText(pkg.name) : '';

      // ── Header band ──────────────────────────────────────────────────
      const headerH = 130;
      doc.setFillColor(...emerald);
      doc.rect(0, 0, pageW, headerH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...gold);
      doc.text('EVENT PASS', lx, 44);

      doc.setFontSize(9);
      doc.text(statusLabel, rx, 44, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text(participantName, lx, 76);

      if (pkg) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(220, 220, 220);
        doc.text(packageName, lx, 96);
      }

      // ── QR code ──────────────────────────────────────────────────────
      y = headerH + 40;
      const qrSize = 150;
      const qrDataUrl = await generateQrDataUrl(codeValue);
      doc.addImage(qrDataUrl, 'PNG', cx - qrSize / 2, y, qrSize, qrSize);
      y += qrSize + 24;

      doc.setFont('courier', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...ink);
      doc.text(codeValue, cx, y, { align: 'center' });
      y += 16;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...muted);
      doc.text(
        isRedeemed
          ? 'This is your race-day wristband'
          : 'Show this QR code at the redemption counter to get your wristband',
        cx, y, { align: 'center' }
      );
      y += 28;

      // ── Price ────────────────────────────────────────────────────────
      if (pkg) {
        doc.setDrawColor(...separator);
        doc.setLineWidth(0.7);
        doc.line(lx, y, rx, y);
        y += 22;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...muted);
        doc.text('ADMIT ONE', lx, y);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...ink);
        doc.text(formatMoney(pkg.price), rx, y, { align: 'right' });
        y += 28;
      }

      doc.setDrawColor(...separator);
      doc.setLineWidth(0.7);
      doc.line(lx, y, rx, y);
      y += 26;

      // ── Runner details ──────────────────────────────────────────────
      ensureSpace(20 + 18 * 3);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...ink);
      doc.text('Runner Details', lx, y);
      y += 20;

      const details: [string, string][] = [
        ['Gender', participant.gender ? participant.gender.charAt(0).toUpperCase() + participant.gender.slice(1) : '-'],
        ['Shirt Size', participant.shirtSize ? participant.shirtSize.toUpperCase() : '-'],
        ['Registered', new Date(participant.createdAt).toLocaleDateString()],
      ];
      for (const [label, value] of details) {
        ensureSpace(18);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...muted);
        doc.text(label, lx, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...ink);
        doc.text(value, rx, y, { align: 'right' });
        y += 18;
      }
      y += 10;

      // ── Package benefits ────────────────────────────────────────────
      if (pkg && (pkg.merchandise.length > 0 || pkg.benefits)) {
        ensureSpace(20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...ink);
        doc.text('Package Benefits', lx, y);
        y += 20;

        if (pkg.merchandise.length > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(...ink);
          const merchLine = sanitizeText(pkg.merchandise.map((m) => m.name).join('  |  '));
          const merchLines: string[] = doc.splitTextToSize(merchLine, rx - lx);
          ensureSpace(merchLines.length * 14 + 8);
          doc.text(merchLines, lx, y);
          y += merchLines.length * 14 + 8;
        }

        if (pkg.benefits) {
          const bullets = parseBenefits(pkg.benefits);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(...muted);
          for (const bullet of bullets) {
            const lines: string[] = doc.splitTextToSize(`- ${sanitizeText(bullet)}`, rx - lx);
            ensureSpace(lines.length * 14);
            doc.text(lines, lx, y);
            y += lines.length * 14;
          }
        }
        y += 14;
      }

      // ── Prizes ───────────────────────────────────────────────────────
      const prizes = pkg
        ? [...pkg.prizes].sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
        : [];
      if (prizes.length > 0) {
        ensureSpace(20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...ink);
        doc.text('When You Win', lx, y);
        y += 20;

        for (const prize of prizes) {
          ensureSpace(16);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(...ink);
          const amount = typeof prize.amount === 'number' && prize.amount > 0
            ? `  -  ${formatMoney(prize.amount)}`
            : '';
          doc.text(`${medalLabel(prize.position)}: ${sanitizeText(prize.name)}${amount}`, lx, y);
          y += 16;
        }
      }

      doc.save(`pass-${participant.code}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { generatePDF, loading };
};
