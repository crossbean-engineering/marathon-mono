import { useAkMarathonQuery } from '@ak-marathon/sdk';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, RefreshCw, User } from 'lucide-react';

export default function ParticipantScanPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Fetch participant by wristband code
  const { data: participantsData, isLoading, refetch } = useAkMarathonQuery("listParticipants", {
    query: { wristbandCode: code },
    enabled: !!code,
    refetchOnWindowFocus: false,
  });

  const participant = participantsData?.[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-dark flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-olive mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-muted-foreground">Loading participant details...</p>
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-dark flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-card rounded-xl shadow-lg border border-border p-8 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Wristband Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The wristband code <span className="font-mono font-semibold">{code}</span> could not be found.
            </p>
            {isAuthenticated ? (
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-2 bg-olive text-white rounded-lg font-semibold hover:bg-olive/90 transition-colors"
              >
                Go Back
              </button>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-olive text-white rounded-lg font-semibold hover:bg-olive/90 transition-colors"
              >
                Go Home
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Determine user role
  const userRole = isAuthenticated ? user?.role : 'public';

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-dark">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => isAuthenticated ? navigate(-1) : navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold">Participant Details</h1>
              <p className="text-sm text-muted-foreground mt-1">Wristband: {code}</p>
            </div>

            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="p-2 border border-border rounded-lg hover:bg-muted transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Participant Info Card */}
        <div className="bg-card rounded-xl shadow-lg border border-border p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-olive/10 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 text-olive" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">
                {participant.name}
              </h2>
              <p className="text-sm text-muted-foreground mb-2">Code: {participant.code}</p>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                participant.status === 'active' ? 'bg-green-100 text-green-700' :
                participant.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                   'bg-red-100 text-red-700'
              }`}>
                {participant.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-6 pt-6 border-t border-border">
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

        {/* Role-based Actions */}
        {(userRole === 'public' || userRole === 'user' || userRole === 'agent') && (
          <div className="bg-card rounded-xl shadow-md border border-border p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-olive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-olive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Wristband Active</h3>
              <p className="text-muted-foreground">
                This wristband is linked and ready for race day.
              </p>
            </div>
          </div>
        )}

        {userRole === 'admin' && (
          <div className="bg-card rounded-xl shadow-md border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Admin Actions</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={() => navigate(`/admin/participants/${participant.id}`)}
                className="px-4 py-3 border border-border rounded-lg hover:bg-muted transition-colors text-left"
              >
                <p className="font-medium">View Full Details</p>
                <p className="text-xs text-muted-foreground mt-1">Complete participant information</p>
              </button>

              <button
                onClick={() => navigate(`/admin/wristbands`)}
                className="px-4 py-3 border border-border rounded-lg hover:bg-muted transition-colors text-left"
              >
                <p className="font-medium">Manage Wristbands</p>
                <p className="text-xs text-muted-foreground mt-1">View and manage all wristbands</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
