import { Injectable } from '@rabstack/rab-api';
import QRCode from 'qrcode';

/**
 * Renders QR codes as base64 data URIs for inlining into email HTML.
 */
@Injectable()
export class QrCodeService {
  async toDataUrl(text: string): Promise<string> {
    return QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 320,
    });
  }
}