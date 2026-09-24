import { useAkMarathonMutation, useAkMarathonQuery } from '@ak-marathon/sdk';
import { ApiDomainError } from '@rabstack/rab-react-sdk';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle, User, Ban, CircleCheck, Trash2, Link2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import { Button } from '../../components/ui';
import { ConfirmDialog } from '../../components/ConfirmDialog';

export default function WristbandDetailsPage() {
    const navigate = useNavigate();
    const { wristbandId } = useParams<{ wristbandId: string }>();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [participantCode, setParticipantCode] = useState('');

    const { data: wristband, isLoading, refetch, isFetching } = useAkMarathonQuery("getWristband", {
        params: { id: wristbandId ?? '' },
        enabled: !!wristbandId,
        refetchOnWindowFocus: false,
    });

    // Look up the linked participant (if any)
    const { data: participantsData } = useAkMarathonQuery("listParticipants", {
        query: { wristbandCode: wristband?.code },
        enabled: !!wristband?.code && wristband?.status === 'redeemed',
        refetchOnWindowFocus: false,
    });
    const linkedParticipant = participantsData?.[0];

    const updateWristband = useAkMarathonMutation("updateWristband", {
        onSuccess: () => {
            toast.success('Wristband updated');
            refetch();
        },
        onError: (error: ApiDomainError) => {
            toast.error(error.getAllMessages().join(', '));
        }
    });

    const deleteWristband = useAkMarathonMutation("deleteWristband", {
        onSuccess: () => {
            toast.success('Wristband deleted');
            navigate('/admin/wristbands');
        },
        onError: (error: ApiDomainError) => {
            toast.error(error.getAllMessages().join(', '));
            setShowDeleteConfirm(false);
        }
    });

    const redeemWristband = useAkMarathonMutation("redeemWristband", {
        onSuccess: () => {
            toast.success('Wristband linked to participant!');
            setParticipantCode('');
            refetch();
        },
        onError: (error: ApiDomainError) => {
            toast.error(error.getAllMessages().join(', '));
        }
    });

    const handleToggleStatus = () => {
        if (!wristband) return;
        const newStatus = wristband.status === 'disabled' ? 'available' : 'disabled';
        updateWristband.mutate({ params: { id: wristband.id }, body: { status: newStatus } });
    };

    const handleRedeem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!wristband || !participantCode.trim()) return;
        redeemWristband.mutate({
            body: { wristbandCode: wristband.code, participantCode: participantCode.trim() },
        });
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-olive"></div>
                <p className="text-muted-foreground mt-4">Loading wristband...</p>
            </div>
        );
    }

    if (!wristband) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-2xl">
                <div className="bg-card rounded-2xl p-12 text-center border border-border">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-display font-bold mb-2">Wristband Not Found</h2>
                    <p className="text-muted-foreground mb-6">
                        The wristband you're looking for doesn't exist or has been removed
                    </p>
                    <Button onClick={() => navigate('/admin/wristbands')}>
                        Back to Wristbands
                    </Button>
                </div>
            </div>
        );
    }

    const isDisabled = wristband.status === 'disabled';

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate('/admin/wristbands')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Wristbands
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

            <div className="grid md:grid-cols-2 gap-6">
                {/* Wristband Card */}
                <div className="bg-card rounded-xl shadow-lg border border-border p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-xl font-display font-bold">Wristband</h1>
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full capitalize ${
                            wristband.status === 'available' ? 'bg-green-100 text-green-700' :
                            wristband.status === 'redeemed'  ? 'bg-olive/10 text-olive' :
                                                               'bg-red-100 text-red-700'
                        }`}>
                            {wristband.status}
                        </span>
                    </div>

                    <div className="bg-muted/30 rounded-xl p-4 mb-4 flex justify-center">
                        <QRCode
                            value={wristband.code}
                            size={180}
                            level="H"
                            fgColor="#000000"
                        />
                    </div>

                    <p className="font-mono text-xl font-bold tracking-wider text-center mb-6">{wristband.code}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Printed</p>
                            <p className="font-medium">{wristband.isPrinted ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Created</p>
                            <p className="font-medium">{new Date(wristband.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-6 pt-6 border-t border-border">
                        <Button
                            onClick={handleToggleStatus}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={updateWristband.isPending || wristband.status === 'redeemed'}
                        >
                            {isDisabled ? (
                                <><CircleCheck className="w-4 h-4 mr-2" /> Enable</>
                            ) : (
                                <><Ban className="w-4 h-4 mr-2" /> Disable</>
                            )}
                        </Button>
                        <Button
                            onClick={() => setShowDeleteConfirm(true)}
                            variant="outline"
                            size="sm"
                            className="flex-1 text-red-600 hover:text-red-700"
                            disabled={deleteWristband.isPending}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Participant / Link */}
                <div className="bg-card rounded-xl shadow-md border border-border overflow-hidden h-fit">
                    <div className="p-6 border-b border-border flex items-center gap-2">
                        <User className="w-5 h-5 text-olive" />
                        <h3 className="font-display font-semibold text-lg">Participant</h3>
                    </div>
                    <div className="p-6">
                        {linkedParticipant ? (
                            <div>
                                <p className="font-semibold">{linkedParticipant.name}</p>
                                <p className="text-sm text-muted-foreground font-mono mb-3">{linkedParticipant.code}</p>
                                <button
                                    onClick={() => navigate(`/admin/participants/${linkedParticipant.id}`)}
                                    className="text-sm text-olive hover:text-olive/80 font-medium"
                                >
                                    View Participant Details →
                                </button>
                            </div>
                        ) : wristband.status === 'available' ? (
                            <form onSubmit={handleRedeem} className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Link this wristband to a participant using their redemption code.
                                </p>
                                <input
                                    value={participantCode}
                                    onChange={(e) => setParticipantCode(e.target.value)}
                                    placeholder="Participant code"
                                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive text-sm font-mono"
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="w-full"
                                    disabled={redeemWristband.isPending || !participantCode.trim()}
                                >
                                    <Link2 className="w-4 h-4 mr-2" />
                                    {redeemWristband.isPending ? 'Linking...' : 'Link Wristband'}
                                </Button>
                            </form>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No participant linked
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <ConfirmDialog
                    title="Delete Wristband"
                    description="This action cannot be undone"
                    message={`Are you sure you want to delete wristband "${wristband.code}"?`}
                    confirmLabel="Delete"
                    isLoading={deleteWristband.isPending}
                    onConfirm={() => deleteWristband.mutate({ params: { id: wristband.id } })}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}
        </div>
    );
}
