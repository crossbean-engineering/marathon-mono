import { useAkMarathonQuery } from '@ak-marathon/sdk';
import type { BaseParticipant } from '@ak-marathon/sdk';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, User, Users, AlertCircle, Eye } from 'lucide-react';
import { Button } from '../../components/ui';

export default function UserDetailsPage() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();

  // No single-user endpoint; reuse the cached role-filtered list and pick by id
  const { data: usersData, isLoading: isLoadingUser } = useAkMarathonQuery("listUsers", {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    query: { role: 'user' },
  });

  const user = useMemo(
    () => (usersData ?? []).find((u) => u.id === userId),
    [usersData, userId]
  );

  const {
    data: participantsData,
    isLoading: isLoadingParticipants,
    isFetching,
    refetch,
  } = useAkMarathonQuery("listParticipants", {
    refetchOnWindowFocus: false,
    enabled: !!userId,
    query: { userId: userId ?? '' },
  });

  const { data: packagesData } = useAkMarathonQuery("listPackages", {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const packageNames = useMemo(
    () => new Map((packagesData ?? []).map((p) => [p.id, p.name])),
    [packagesData]
  );

  const participants = participantsData ?? [];

  const statusBadge = (status: BaseParticipant['status']) =>
    status === 'active' ? 'bg-green-100 text-green-700' :
    status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                           'bg-red-100 text-red-700';

  if (isLoadingUser) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-olive"></div>
        <p className="text-muted-foreground mt-4">Loading user...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="bg-card rounded-2xl p-12 text-center border border-border">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">User Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The user you're looking for doesn't exist or has been removed
          </p>
          <Button onClick={() => navigate('/admin/users')}>
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
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

      {/* User Info */}
      <div className="bg-card rounded-xl shadow-lg border border-border p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-olive/10 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-olive" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">{user.firstName} {user.lastName}</h1>
            <p className="text-sm text-muted-foreground mb-2">{user.phone}</p>
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
              user.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {user.status === 'active' ? 'Active' : 'Suspended'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-6 pt-6 border-t border-border">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Email</p>
            <p className="font-medium">{user.email || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Role</p>
            <p className="font-medium capitalize">{user.role}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Joined</p>
            <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="bg-card rounded-xl shadow-md border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-olive" />
            <h3 className="font-display font-semibold text-lg">Participants</h3>
          </div>
          <span className="text-sm text-muted-foreground">
            {participants.length} registration{participants.length === 1 ? '' : 's'}
          </span>
        </div>

        {isLoadingParticipants ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-olive"></div>
            <p className="text-muted-foreground mt-4">Loading participants...</p>
          </div>
        ) : participants.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No participants registered under this account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Wristband
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {participants.map((participant: BaseParticipant) => (
                  <tr key={participant.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{participant.name}</td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-sm">{participant.code}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {packageNames.get(participant.packageId) ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium capitalize ${statusBadge(participant.status)}`}>
                        {participant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-sm">
                      {participant.wristbandCode || '—'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">
                      {new Date(participant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/admin/participants/${participant.id}`)}
                        className="text-olive hover:text-olive/80 text-sm font-medium inline-flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
