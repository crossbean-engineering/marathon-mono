import { useAkMarathonQuery, useRenderPrice } from '@ak-marathon/sdk';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, User, IdCard, Gift, Trophy, AlertCircle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Button } from '../../components/ui';
import { ParticipantCheckinPanel } from '../../components/ParticipantCheckinPanel';
import { ParticipantAddOns } from '../../components/ParticipantAddOns';

export default function ParticipantDetailsPage() {
    const navigate = useNavigate();
    const { participantId } = useParams<{ participantId: string }>();
    const { renderPrice } = useRenderPrice();

    const { data: participant, isLoading, refetch, isFetching } = useAkMarathonQuery("getParticipant", {
        params: { id: participantId ?? '' },
        enabled: !!participantId,
        refetchOnWindowFocus: false,
    });

    const { data: packageData } = useAkMarathonQuery("getPackage", {
        params: { id: participant?.packageId ?? '' },
        enabled: !!participant?.packageId,
        refetchOnWindowFocus: false,
    });

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-olive"></div>
                <p className="text-muted-foreground mt-4">Loading participant...</p>
            </div>
        );
    }

    if (!participant) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-2xl">
                <div className="bg-card rounded-2xl p-12 text-center border border-border">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-display font-bold mb-2">Participant Not Found</h2>
                    <p className="text-muted-foreground mb-6">
                        The participant you're looking for doesn't exist or has been removed
                    </p>
                    <Button onClick={() => navigate('/admin/participants')}>
                        Back to Participants
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate('/admin/participants')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Participants
                </button>
                <Button
                    onClick={() => refetch()}
                    variant="outline"
                    size="sm"
                    disabled={isFetching}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Participant Info */}
            <div className="bg-card rounded-xl shadow-lg border border-border p-6 mb-6">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-olive/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-8 h-8 text-olive" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold mb-1">{participant.name}</h1>
                        <p className="text-sm text-muted-foreground font-mono mb-2">Code: {participant.code}</p>
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full capitalize ${
                            participant.status === 'active' ? 'bg-green-100 text-green-700' :
                            participant.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                               'bg-red-100 text-red-700'
                        }`}>
                            {participant.status}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-6 pt-6 border-t border-border">
                    <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Vest Size</p>
                        <p className="font-medium uppercase">{participant.shirtSize || '—'}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Gender</p>
                        <p className="font-medium capitalize">{participant.gender || '—'}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">ID Number</p>
                        <p className="font-medium">{participant.ic || '—'}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Registered</p>
                        <p className="font-medium">{new Date(participant.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>

                <ParticipantAddOns addOns={participant.addOns} className="mt-6 pt-6 border-t border-border" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Wristband */}
                <div className="bg-card rounded-xl shadow-md border border-border overflow-hidden">
                    <div className="p-6 border-b border-border flex items-center gap-2">
                        <IdCard className="w-5 h-5 text-olive" />
                        <h3 className="font-display font-semibold text-lg">Wristband</h3>
                    </div>
                    <div className="p-6">
                        {participant.wristbandCode ? (
                            <div className="text-center">
                                <div className="bg-green-50 rounded-xl p-4 mb-4 inline-flex">
                                    <QRCode
                                        value={participant.wristbandCode}
                                        size={160}
                                        level="H"
                                        fgColor="#000000"
                                    />
                                </div>
                                <p className="font-mono text-lg font-bold tracking-wider">{participant.wristbandCode}</p>
                                <p className="text-xs text-muted-foreground mt-1">Linked wristband</p>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground text-sm">
                                    No wristband linked yet. Use the redemption code{' '}
                                    <code className="bg-muted px-2 py-0.5 rounded font-mono text-xs">{participant.code}</code>{' '}
                                    at the redemption counter.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Package */}
                <div className="bg-card rounded-xl shadow-md border border-border overflow-hidden">
                    <div className="p-6 border-b border-border flex items-center gap-2">
                        <Gift className="w-5 h-5 text-olive" />
                        <h3 className="font-display font-semibold text-lg">Package</h3>
                    </div>
                    <div className="p-6">
                        {packageData ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="font-display font-bold">{packageData.name}</p>
                                    <p className="font-bold">{renderPrice(packageData.price)}</p>
                                </div>
                                {packageData.benefits && (
                                    <p className="text-sm text-muted-foreground">{packageData.benefits}</p>
                                )}
                                {packageData.merchandise.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {packageData.merchandise.map((item) => (
                                            <span
                                                key={item.id}
                                                className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground font-medium"
                                            >
                                                {item.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {packageData.prizes.length > 0 && (
                                    <div className="space-y-1.5">
                                        {packageData.prizes.map((prize) => (
                                            <div key={prize.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                                {prize.name}
                                                {typeof prize.amount === 'number' && ` · ${renderPrice(prize.amount)}`}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm text-center py-8">Package information unavailable</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <ParticipantCheckinPanel
                    key={participant.id}
                    participant={participant}
                    merchandise={packageData?.merchandise ?? []}
                    onUpdated={() => refetch()}
                />
            </div>
        </div>
    );
}
