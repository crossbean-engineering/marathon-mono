import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, Edit3 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

// --- Types ---

export interface WristbandData {
  code: string;
  balance: number;
  accountId: string;
  accountName: string;
  participantName?: string;
  participantType: 'identified' | 'anonymous';
}

export type FeedbackType = 'success' | 'error' | 'warning';

export interface ScannerFeedback {
  type: FeedbackType;
  message: string;
}

// --- Hook: useWristbandScanner ---

export interface UseWristbandScannerOptions {
  onScan?: (code: string) => void;
}

export function useWristbandScanner(options?: UseWristbandScannerOptions) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [feedback, setFeedback] = useState<ScannerFeedback | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');
  const feedbackTimeoutRef = useRef<number | null>(null);
  const onScanRef = useRef(options?.onScan);

  // Keep onScan ref up to date without causing re-renders
  useEffect(() => {
    onScanRef.current = options?.onScan;
  }, [options?.onScan]);

  // Extract wristband code from URL format: http://domain/participant/{CODE}
  const extractWristbandCode = useCallback((scannedText: string): string => {
    try {
      const match = scannedText.match(/\/participant\/([^/?#]+)/);
      if (match) {
        return match[1].trim();
      }
      return scannedText.trim();
    } catch {
      return scannedText.trim();
    }
  }, []);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Play feedback sound
  const playSound = useCallback((type: 'success' | 'error') => {
    if (!audioContextRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    if (type === 'success') {
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioContextRef.current.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.3);
    } else {
      oscillator.frequency.setValueAtTime(300, audioContextRef.current.currentTime);
      oscillator.type = 'sawtooth';
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.4);
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.4);
    }
  }, []);

  // Show feedback
  const showFeedback = useCallback((type: FeedbackType, message: string) => {
    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    setFeedback({ type, message });
    playSound(type === 'success' ? 'success' : 'error');

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback(null);
      feedbackTimeoutRef.current = null;
    }, 2000);
  }, [playSound]);

  // Stop camera scanning
  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  }, []);

  // Start camera scanning
  const startScanning = useCallback(async () => {
    setCameraError('');
    setShowManualInput(false);
    setIsScanning(true);

    // Small delay to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: 250,
          aspectRatio: 1.0,
        },
        (decodedText) => {
          const now = Date.now();
          const extractedCode = extractWristbandCode(decodedText);

          if (
            extractedCode === lastScannedCodeRef.current &&
            now - lastScanTimeRef.current < 2000
          ) {
            return;
          }

          lastScannedCodeRef.current = extractedCode;
          lastScanTimeRef.current = now;
          onScanRef.current?.(extractedCode);
        },
        () => {
          // Ignore errors during scanning
        }
      );
    } catch (err: any) {
      console.error('Camera error:', err);
      let errorMessage = 'Camera access denied';

      if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
        errorMessage = 'Camera permission denied. Please enable camera access in your browser settings or use manual input.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please use manual input.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is in use by another app. Please close other apps or use manual input.';
      }

      setCameraError(errorMessage);
      setShowManualInput(true);
      setIsScanning(false);
      showFeedback('error', 'Camera unavailable');
    }
  }, [extractWristbandCode, showFeedback]);

  // Handle manual input submit
  const handleManualSubmit = useCallback(() => {
    const trimmedInput = manualInput.trim();

    if (!trimmedInput) {
      showFeedback('error', 'Please enter a wristband code');
      return;
    }

    setManualInput('');
    const extractedCode = extractWristbandCode(trimmedInput);
    onScanRef.current?.(extractedCode);
  }, [manualInput, extractWristbandCode, showFeedback]);

  // Reset scanner state
  const resetScanner = useCallback(async () => {
    setManualInput('');
    setCameraError('');
    setShowManualInput(false);
    lastScannedCodeRef.current = '';
    lastScanTimeRef.current = 0;
    await stopScanning();
  }, [stopScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    isScanning,
    cameraError,
    showManualInput,
    manualInput,
    feedback,
    // Actions
    startScanning,
    stopScanning,
    resetScanner,
    showFeedback,
    handleManualSubmit,
    setManualInput,
    setShowManualInput,
    extractWristbandCode,
  };
}

export type WristbandScannerHook = ReturnType<typeof useWristbandScanner>;

// --- Component: WristbandScanner ---

export interface WristbandScannerProps {
  scanner: WristbandScannerHook;
  disabled?: boolean;
  isLoading?: boolean;
  label?: string;
  disabledMessage?: string;
}

export function WristbandScanner({
  scanner,
  disabled = false,
  isLoading = false,
  label,
  disabledMessage = 'Scanner disabled',
}: WristbandScannerProps) {
  const {
    isScanning,
    cameraError,
    showManualInput,
    manualInput,
    startScanning,
    stopScanning,
    setManualInput,
    setShowManualInput,
    handleManualSubmit,
    showFeedback,
  } = scanner;

  const handleStartScanning = () => {
    if (disabled) {
      showFeedback('warning', disabledMessage);
      return;
    }
    startScanning();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-olive" />
          <h3 className="text-lg font-semibold">Scan Wristband</h3>
        </div>
        {label && (
          <span className="text-sm font-medium text-olive">
            {label}
          </span>
        )}
      </div>

      {/* Camera Error */}
      {cameraError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
          <p className="text-sm text-destructive font-medium mb-2">{cameraError}</p>
          <button
            onClick={() => setShowManualInput(true)}
            className="text-sm text-olive hover:underline font-medium"
          >
            Use manual input instead
          </button>
        </div>
      )}

      {/* QR Scanner */}
      {isScanning ? (
        <div
          id="qr-reader"
          className="w-full min-h-[400px] rounded-lg overflow-hidden mb-4 bg-black"
          style={{ minHeight: '400px', display: 'block' }}
        ></div>
      ) : !showManualInput ? (
        <div className="bg-muted/30 border-2 border-dashed border-border rounded-lg p-12 text-center mb-4">
          <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">
            {disabled ? disabledMessage : 'Ready to scan'}
          </p>
        </div>
      ) : null}

      {/* Manual Input */}
      {showManualInput && !isScanning && (
        <div className="mb-4 p-4 bg-muted/30 border border-border rounded-lg">
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Enter Wristband Code
          </label>
          <div className="flex gap-2 flex-col">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              placeholder="FD9AD5C7BBB"
              className="flex-1 px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive font-mono"
              disabled={isLoading}
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualInput.trim() || isLoading}
              className="px-6 py-3 bg-olive text-white rounded-lg font-semibold hover:bg-olive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Check'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Scan Button */}
      {!showManualInput && (
        <button
          onClick={isScanning ? stopScanning : handleStartScanning}
          disabled={disabled || isLoading}
          className={`w-full py-3.5 rounded-lg font-semibold transition-colors shadow-sm ${
            isScanning
              ? 'bg-destructive hover:bg-destructive/90 text-white'
              : 'bg-olive hover:bg-olive/90 text-white disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </span>
          ) : isScanning ? (
            <span className="flex items-center justify-center gap-2">
              <X className="w-5 h-5" />
              Stop Scanning
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Camera className="w-5 h-5" />
              Start Camera
            </span>
          )}
        </button>
      )}

      {/* Toggle Manual Input */}
      {!isScanning && !cameraError && (
        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showManualInput ? 'Switch to camera' : 'Enter code manually'}
        </button>
      )}
    </div>
  );
}

// --- Component: ScannerFeedbackOverlay ---

export function ScannerFeedbackOverlay({ feedback }: { feedback: ScannerFeedback | null }) {
  if (!feedback) return null;

  return (
    <>
      <div className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none animate-fadeOut ${
        feedback.type === 'success' ? 'bg-olive/90' : 'bg-destructive/90'
      }`}>
        <div className="text-center animate-pulse">
          <div className="text-8xl mb-4">
            {feedback.type === 'success' ? '\u2713' : '\u2717'}
          </div>
          <p className="text-2xl font-bold text-white">{feedback.message}</p>
        </div>
      </div>

      <style>{`
        @keyframes fadeOut {
          0%, 70% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-fadeOut {
          animation: fadeOut 2s forwards;
        }
      `}</style>
    </>
  );
}

// --- Scanner CSS (inject once) ---

export const SCANNER_STYLES = `
  /* QR Scanner Styling - Force visibility */
  #qr-reader {
    position: relative;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }

  #qr-reader video {
    width: 100% !important;
    height: auto !important;
    max-width: 100% !important;
    border-radius: 0.5rem;
    display: block !important;
    visibility: visible !important;
  }

  #qr-reader__scan_region {
    display: block !important;
  }

  #qr-reader__camera_selection,
  #qr-reader__dashboard,
  #qr-reader__dashboard_section,
  #qr-reader__dashboard_section_csr,
  #qr-reader__dashboard_section_fsr {
    display: none !important;
  }
`;