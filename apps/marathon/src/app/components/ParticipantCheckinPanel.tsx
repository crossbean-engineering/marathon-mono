import { useState } from 'react';
import { useAkMarathonMutation } from '@ak-marathon/sdk';
import type { BaseParticipant, BaseMerchandise } from '@ak-marathon/sdk';
import { ApiDomainError } from '@rabstack/rab-react-sdk';
import { toast } from 'sonner';
import { CheckCircle, Flag, Loader2, Package } from 'lucide-react';
import { SHIRT_SIZES } from '../types/packages';
import type { ShirtSize } from '../types/packages';
import { ParticipantAddOns } from './ParticipantAddOns';

interface ParticipantCheckinPanelProps {
  participant: BaseParticipant;
  merchandise: BaseMerchandise[];
  onUpdated: () => void;
}

// Shared by the admin participant-detail page and the agent race-day check-in
// desk — both roles are allowed to call checkInParticipant/setCollectedMerchandise.
export function ParticipantCheckinPanel({ participant, merchandise, onUpdated }: ParticipantCheckinPanelProps) {
  const [runnerNumber, setRunnerNumber] = useState('');
  const [shirtSizeOverride, setShirtSizeOverride] = useState<ShirtSize | ''>('');
  const [collectedIds, setCollectedIds] = useState<string[]>(
    () => participant.collectedMerchandise?.map((c) => c.merchandiseId) ?? []
  );

  const checkIn = useAkMarathonMutation('checkInParticipant', {
    onSuccess: () => {
      toast.success('Participant checked in');
      onUpdated();
    },
    onError: (error: ApiDomainError) => {
      switch (error.errorCode) {
        case 'PARTICIPANT_ALREADY_CHECKED_IN':
          toast.error(error.getDisplayMessage() || 'Already checked in');
          onUpdated();
          break;
        case 'RUNNER_NUMBER_TAKEN':
          toast.error('That runner number is already assigned to someone else');
          break;
        case 'PARTICIPANT_NOT_FOUND':
          toast.error('Participant not found — refreshing');
          onUpdated();
          break;
        default:
          toast.error(error.getDisplayMessage() || 'Check-in failed');
      }
    },
  });

  const saveMerchandise = useAkMarathonMutation('setCollectedMerchandise', {
    onSuccess: (data) => {
      const changes = data.added.length + data.removed.length;
      toast.success(changes > 0 ? `Saved — ${data.added.length} added, ${data.removed.length} removed` : 'No changes to save');
      onUpdated();
    },
    onError: (error: ApiDomainError) => {
      toast.error(error.getDisplayMessage() || 'Failed to save collected merchandise');
    },
  });

  const handleCheckIn = () => {
    if (!runnerNumber.trim()) {
      toast.error('Please enter a runner number');
      return;
    }
    checkIn.mutate({
      params: { id: participant.id },
      body: {
        runnerNumber: runnerNumber.trim(),
        ...(shirtSizeOverride ? { shirtSize: shirtSizeOverride } : {}),
      },
    });
  };

  const toggleMerchandise = (id: string) => {
    setCollectedIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSaveMerchandise = () => {
    saveMerchandise.mutate({
      params: { id: participant.id },
      body: { merchandiseIds: collectedIds },
    });
  };

  return (
    <div className="space-y-6">
      {/* Race-day check-in */}
      <div className="bg-card rounded-xl shadow-md border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <Flag className="w-5 h-5 text-olive" />
          <h3 className="font-display font-semibold text-lg">Race-Day Check-In</h3>
        </div>
        <div className="p-6">
          {/* Travelling runners: what to hand over or confirm at the desk. */}
          <ParticipantAddOns addOns={participant.addOns} className="mb-5 pb-5 border-b border-border" />
          {participant.runnerNumber ? (
            <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 rounded-lg p-4">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Checked in — Runner #{participant.runnerNumber}</p>
                {participant.checkinDate && (
                  <p className="text-xs text-green-700/70 mt-0.5">
                    {new Date(participant.checkinDate).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Runner Number</label>
                <input
                  value={runnerNumber}
                  onChange={(e) => setRunnerNumber(e.target.value)}
                  placeholder="e.g. 1042"
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Shirt Size {participant.shirtSize && `(on record: ${participant.shirtSize.toUpperCase()})`}
                </label>
                <select
                  value={shirtSizeOverride}
                  onChange={(e) => setShirtSizeOverride(e.target.value as ShirtSize)}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive text-sm"
                >
                  <option value="">Keep on record</option>
                  {SHIRT_SIZES.map((size) => (
                    <option key={size} value={size}>{size.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCheckIn}
                disabled={checkIn.isPending || !runnerNumber.trim()}
                className="w-full py-2.5 bg-olive text-white rounded-lg font-semibold hover:bg-olive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkIn.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking in...</>
                  : 'Check In'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Collected merchandise */}
      <div className="bg-card rounded-xl shadow-md border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <Package className="w-5 h-5 text-olive" />
          <h3 className="font-display font-semibold text-lg">Collected Merchandise</h3>
        </div>
        <div className="p-6">
          {merchandise.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No merchandise in this package</p>
          ) : (
            <div className="space-y-2">
              {merchandise.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={collectedIds.includes(item.id)}
                    onChange={() => toggleMerchandise(item.id)}
                    className="mt-0.5 w-4 h-4 accent-olive"
                  />
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </label>
              ))}
              <button
                onClick={handleSaveMerchandise}
                disabled={saveMerchandise.isPending}
                className="w-full mt-2 py-2.5 border border-olive text-olive rounded-lg font-semibold hover:bg-olive/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saveMerchandise.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  : 'Save Collected Items'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
