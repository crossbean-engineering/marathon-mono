import { useEffect, useRef, useState } from 'react';
import { useAkMarathonQuery } from '@ak-marathon/sdk';
import { ArrowLeft, Loader2, User } from 'lucide-react';
import { ParticipantCheckinPanel } from './ParticipantCheckinPanel';
import {
  WristbandScanner,
  ScannerFeedbackOverlay,
  useWristbandScanner,
  SCANNER_STYLES,
} from './WristbandScanner';

export function CheckInLookup() {
  const [searchedCode, setSearchedCode] = useState('');
  const feedbackShownForRef = useRef('');

  // Scanning a pass QR and typing a code manually both route through this one
  // onScan callback (the scanner component provides the manual-entry fallback
  // itself), so there's a single code path from "code known" to "look it up".
  const scanner = useWristbandScanner({
    onScan: (code) => setSearchedCode(code),
  });
  const { stopScanning, showFeedback, resetScanner } = scanner;

  const { data: participantsData, isLoading, refetch } = useAkMarathonQuery('listParticipants', {
    query: { code: searchedCode },
    enabled: !!searchedCode,
    refetchOnWindowFocus: false,
  });

  const participant = participantsData?.[0];

  const { data: packageData } = useAkMarathonQuery('getPackage', {
    params: { id: participant?.packageId ?? '' },
    enabled: !!participant?.packageId,
    refetchOnWindowFocus: false,
  });

  // A code came in (scan or manual) — stop the camera and switch to the result view.
  useEffect(() => {
    if (searchedCode) stopScanning();
  }, [searchedCode, stopScanning]);

  // One feedback beep/flash per looked-up code, not on every background refetch.
  useEffect(() => {
    if (!searchedCode || isLoading) return;
    if (feedbackShownForRef.current === searchedCode) return;
    feedbackShownForRef.current = searchedCode;
    showFeedback(participant ? 'success' : 'error', participant ? `Found ${participant.name}` : 'No participant found');
  }, [searchedCode, isLoading, participant, showFeedback]);

  const handleReset = () => {
    setSearchedCode('');
    feedbackShownForRef.current = '';
    resetScanner();
  };

  return (
    <div className="max-w-xl mx-auto pb-8 space-y-6">
      <div className="space-y-1 pt-8">
        <h1 className="text-2xl font-bold tracking-tight">Race-Day Check-In</h1>
        <p className="text-muted-foreground text-sm">
          Scan a participant's pass to assign a runner number and hand out merchandise
        </p>
      </div>

      {!searchedCode ? (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <WristbandScanner scanner={scanner} label="Scan to check in" />
        </div>
      ) : (
        <>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Scan another
          </button>

          {isLoading ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-olive mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Looking up participant...</p>
            </div>
          ) : !participant ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No participant found for code <span className="font-mono">{searchedCode}</span>
              </p>
            </div>
          ) : (
            <>
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 bg-olive/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-olive" />
                </div>
                <div>
                  <p className="font-semibold">{participant.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">{participant.code}</p>
                  <span className={`inline-flex mt-2 px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${
                    participant.status === 'active' ? 'bg-green-100 text-green-700' :
                    participant.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                       'bg-red-100 text-red-700'
                  }`}>
                    {participant.status}
                  </span>
                </div>
              </div>

              <ParticipantCheckinPanel
                key={participant.id}
                participant={participant}
                merchandise={packageData?.merchandise ?? []}
                onUpdated={() => refetch()}
              />
            </>
          )}
        </>
      )}

      <ScannerFeedbackOverlay feedback={scanner.feedback} />
      <style>{SCANNER_STYLES}</style>
    </div>
  );
}
