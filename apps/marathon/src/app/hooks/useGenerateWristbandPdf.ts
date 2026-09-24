import { useState } from 'react';
import { AwesomeQR } from 'awesome-qr';

type WristbandItem = {
  code: string;
};

type GenerateWristbandPdfOptions = {
  wristbands: WristbandItem[];
  baseUrl?: string;
};

export const useGenerateWristbandPdf = () => {
  const [loading, setLoading] = useState(false);
  const [PdfEngine, setPdfEngine] =
    useState<typeof import('jspdf').default>();

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

  const generatePDF = async (options: GenerateWristbandPdfOptions) => {
    const { wristbands, baseUrl } = options;
    if (wristbands.length === 0) return;

    setLoading(true);

    try {
      let JSPdf = PdfEngine;
      if (!JSPdf) {
        const { default: jsPdf } = await import('jspdf');
        setPdfEngine(() => jsPdf);
        JSPdf = jsPdf;
      }

      const doc = new JSPdf({
        orientation: 'portrait',
        format: 'a4',
        unit: 'mm',
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
      const margin = 10;

      // Grid layout: each cell sized to fit a wristband tag
      const cols = 4;
      const rows = 6;
      const cellWidth = (pageWidth - margin * 2) / cols; // ~47.5mm
      const cellHeight = (pageHeight - margin * 2) / rows; // ~46.2mm
      const qrSize = Math.min(cellWidth, cellHeight) - 16; // QR with padding

      let index = 0;

      while (index < wristbands.length) {
        if (index > 0) doc.addPage();

        const itemsOnPage = Math.min(cols * rows, wristbands.length - index);

        for (let i = 0; i < itemsOnPage; i++) {
          const wb = wristbands[index + i];
          const col = i % cols;
          const row = Math.floor(i / cols);

          const x = margin + col * cellWidth;
          const y = margin + row * cellHeight;

          // Dotted border for cutting guide
          doc.setDrawColor(150, 150, 150);
          doc.setLineDashPattern([2, 2], 0);
          doc.setLineWidth(0.3);
          doc.rect(x, y, cellWidth, cellHeight);

          // QR code
          const qrText = baseUrl
            ? `${baseUrl}/participant/${wb.code}`
            : wb.code;
          const qrDataUrl = await generateQrDataUrl(qrText);

          const qrX = x + (cellWidth - qrSize) / 2;
          const qrY = y + 3;
          doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

          // Code label below QR
          doc.setFont('courier', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(50, 50, 50);
          const textY = qrY + qrSize + 4;
          doc.text(wb.code, x + cellWidth / 2, textY, { align: 'center' });
        }

        index += itemsOnPage;
      }

      doc.save(`wristbands-batch-${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { generatePDF, loading };
};
