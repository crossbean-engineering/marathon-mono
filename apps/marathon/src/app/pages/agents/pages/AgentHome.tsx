import { useState } from 'react';
import { useAkMarathonQuery, useAkMarathonMutation } from '@ak-marathon/sdk';
import { ApiDomainError } from '@rabstack/rab-react-sdk';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, Loader2, User } from 'lucide-react';
import {
  useWristbandScanner,
  WristbandScanner,
  ScannerFeedbackOverlay,
} from '../../../components/WristbandScanner';

/**
 * Agent Home — central scan point.
 * Scan a wristband here to:
 *  - See the participant it is linked to
 *  - Link it to a participant using their redemption code
 */
export default function AgentHome() {
  const [scannedCode, setScannedCode] = useState<string>('');
  const [participantCode, setParticipantCode] = useState('');

  const scanner = useWristbandScanner({
    onScan: (code) => setScannedCode(code),
  });

  // Look up the participant linked to this wristband (if any)
  const { data: participantsData, isLoading, refetch } = useAkMarathonQuery('listParticipants', {
    query: { wristbandCode: scannedCode },
    enabled: !!scannedCode,
    refetchOnWindowFocus: false,
  });

  const linkedParticipant = participantsData?.[0];

  const redeemWristband = useAkMarathonMutation('redeemWristband', {
    onSuccess: () => {
      toast.success('Wristband linked!');
      setParticipantCode('');
      refetch();
    },
    onError: (error: ApiDomainError) => {
      toast.error(error.getAllMessages?.()[0] || 'Failed to link wristband');
    },
  });

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedCode || !participantCode.trim()) return;
    redeemWristband.mutate({
      body: {
        wristbandCode: scannedCode,
        participantCode: participantCode.trim(),
      },
    });
  };

  const resetScan = async () => {
    setScannedCode('');
    setParticipantCode('');
    await scanner.resetScanner();
  };

  return (
    <div className="max-w-xl mx-auto pb-8 space-y-6">
      {!scannedCode ? (
        <>
          <div className="space-y-1 pt-8">
            <h1 className="text-2xl font-bold tracking-tight">Welcome Home</h1>
            <p className="text-muted-foreground text-sm">
              Scan a wristband to view or link its participant
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm">
            <WristbandScanner
              scanner={scanner}
              isLoading={isLoading}
              label="Scan to begin"
            />
          </div>
        </>
      ) : (
        <div className="space-y-4 pt-8">
          <button
            onClick={resetScan}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Scan another
          </button>

          {/* Wristband summary */}
          <div className="bg-olive text-white rounded-xl p-4">
            <p className="text-xs text-white/60 mb-0.5">Wristband</p>
            <p className="font-mono font-semibold text-lg">{scannedCode}</p>
          </div>

          {isLoading ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-olive mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Looking up participant...</p>
            </div>
          ) : linkedParticipant ? (
            /* Wristband already linked — show participant */
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <p className="text-sm font-medium">Linked to participant</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-olive/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-olive" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{linkedParticipant.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">{linkedParticipant.code}</p>
                  <span className={`inline-flex mt-2 px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${
                    linkedParticipant.status === 'active' ? 'bg-green-100 text-green-700' :
                    linkedParticipant.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                             'bg-red-100 text-red-700'
                  }`}>
                    {linkedParticipant.status}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Not linked — offer to redeem against a participant code */
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="font-semibold mb-1">Link Wristband</h2>
              <p className="text-sm text-muted-foreground mb-4">
                This wristband isn't linked yet. Enter the participant's redemption code to link it.
              </p>
              <form onSubmit={handleRedeem} className="space-y-4">
                <input
                  value={participantCode}
                  onChange={(e) => setParticipantCode(e.target.value)}
                  required
                  placeholder="Participant code"
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive text-sm font-mono"
                />
                <button
                  type="submit"
                  disabled={redeemWristband.isPending || !participantCode.trim()}
                  className="w-full py-3 bg-olive text-white rounded-lg font-semibold hover:bg-olive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {redeemWristband.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Linking...</>
                    : 'Link Wristband'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      <ScannerFeedbackOverlay feedback={scanner.feedback} />
    </div>
  );
}
