import { useAkMarathonQuery } from '@ak-marathon/sdk';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, RefreshCw, User, ShieldCheck, Clock, LogIn, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui';

export default function CheckinPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Look up participant by their redemption code (backend requires auth for this)
  const { data: participantsData, isLoading, isError, refetch, isFetching } = useAkMarathonQuery('listParticipants', {
    query: { code },
    enabled: !!code && isAuthenticated,
    refetchOnWindowFocus: false,
  });

  const participant = participantsData?.[0];

  const { data: pkg } = useAkMarathonQuery('getPackage', {
    params: { id: participant?.packageId ?? '' },
    enabled: !!participant?.packageId,
    refetchOnWindowFocus: false,
  });

  const isRedeemed = !!participant?.wristbandCode;

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-dark flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-olive mb-4"></div>
          <p className="text-muted-foreground">Verifying ticket...</p>
        </div>
      </div>
    );
  }

  // Not logged in — lookup requires a staff/user account until a public endpoint exists
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-dark flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-card rounded-xl shadow-lg border border-border p-8 text-center">
            <div className="w-16 h-16 bg-olive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-olive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Ticket Verification</h2>
            <p className="text-muted-foreground mb-1">Ticket code</p>
            <p className="font-mono font-bold text-lg mb-4 break-all">{code}</p>
            <p className="text-muted-foreground mb-6">
              Log in to verify this ticket and view participant details.
            </p>
            <Button onClick={() => navigate('/login', { state: { from: location } })} className="w-full">
              <LogIn className="w-4 h-4" />
              Log In to Verify
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !participant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-dark flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-card rounded-xl shadow-lg border border-border p-8 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Ticket Not Found</h2>
            <p className="text-muted-foreground mb-6">
              No participant was found for the code{' '}
              <span className="font-mono font-semibold break-all">{code}</span>.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                Try Again
              </Button>
              <Button onClick={() => navigate('/')}>Go Home</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-dark">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold">Ticket Verification</h1>
              <p className="text-sm text-muted-foreground mt-1 font-mono">{code}</p>
            </div>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 border border-border rounded-lg hover:bg-muted transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div
          className={`rounded-xl p-4 mb-6 flex items-center gap-3 border ${
            isRedeemed
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}
        >
          {isRedeemed ? <ShieldCheck className="w-6 h-6 shrink-0" /> : <Clock className="w-6 h-6 shrink-0" />}
          <div>
            <p className="font-semibold">{isRedeemed ? 'Verified — Wristband Issued' : 'Valid Ticket — Wristband Not Yet Issued'}</p>
            <p className="text-sm opacity-80">
              {isRedeemed
                ? `Linked to wristband ${participant.wristbandCode}`
                : 'This participant has not redeemed a wristband yet.'}
            </p>
          </div>
        </div>

        {/* Participant Info Card */}
        <div className="bg-card rounded-xl shadow-lg border border-border p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-olive/10 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 text-olive" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{participant.name}</h2>
              <p className="text-sm text-muted-foreground mb-2">Code: {participant.code}</p>
              <span
                className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                  participant.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : participant.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {participant.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-6 pt-6 border-t border-border">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Package</p>
              <p className="font-medium">{pkg?.name || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Shirt Size</p>
              <p className="font-medium uppercase">{participant.shirtSize || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Gender</p>
              <p className="font-medium capitalize">{participant.gender || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Wristband</p>
              <p className="font-mono font-medium">{participant.wristbandCode || '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
