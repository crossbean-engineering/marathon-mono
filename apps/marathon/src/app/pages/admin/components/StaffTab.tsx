import { useAkMarathonQuery } from '@ak-marathon/sdk';
import type { BaseUser, UserRole } from '@ak-marathon/sdk';
import { useMemo, useState } from 'react';
import { Edit2, RefreshCw, Search } from 'lucide-react';
import { UserModal } from './userModal';
import { Pagination } from '../../../components/Pagination';

const PAGE_SIZE = 10;

type RoleFilter = 'all' | 'agent' | 'admin';

export default function StaffTab() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  // Fetch staff (agents + admins)
  const {
    data: usersData,
    isLoading,
    isFetching,
    refetch
  } = useAkMarathonQuery("listUsers", {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Client-side role filter, search + pagination (the API returns the full list)
  const filteredStaff = useMemo(() => {
    let all = (usersData ?? []).filter(
      (u: BaseUser) => u.role === 'agent' || u.role === 'admin'
    );
    if (roleFilter !== 'all') {
      all = all.filter((u) => u.role === roleFilter);
    }
    if (searchTerm.trim()) {
      const needle = searchTerm.trim().toLowerCase();
      all = all.filter((u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(needle) ||
        u.phone.toLowerCase().includes(needle) ||
        (u.email ?? '').toLowerCase().includes(needle)
      );
    }
    return all;
  }, [usersData, roleFilter, searchTerm]);

  const total = filteredStaff.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const staff = filteredStaff.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const roleBadge = (role: UserRole) =>
    role === 'admin'
      ? 'bg-golden/15 text-golden'
      : 'bg-olive/10 text-olive';

  return (
    <div className="space-y-6">

      {/* Main Table */}
      <div className="bg-card rounded-xl shadow-md border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex flex-wrap justify-between items-center gap-3">
          <div>
            <h3 className="font-display font-semibold text-xl">Staff</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Agents and admins with access to the portal
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                placeholder="Search staff..."
                className="pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring w-44"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value as RoleFilter); setPage(1); }}
              className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Roles</option>
              <option value="agent">Agents</option>
              <option value="admin">Admins</option>
            </select>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span className='hidden md:block'>Refresh</span>
            </button>
            <UserModal userRole="agent" onSuccess={() => refetch()} />
            <UserModal userRole="admin" onSuccess={() => refetch()} />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-olive"></div>
            <p className="text-muted-foreground mt-4">Loading staff...</p>
          </div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No staff found.</p>
            <div className="flex justify-center gap-3">
              <UserModal userRole="agent" onSuccess={() => refetch()} />
              <UserModal userRole="admin" onSuccess={() => refetch()} />
            </div>
          </div>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staff.map((member: BaseUser) => (
                  <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {member.firstName} {member.lastName}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium capitalize ${roleBadge(member.role)}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{member.phone}</td>
                    <td className="px-6 py-4 text-muted-foreground">{member.email || '-'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-medium ${
                          member.status === 'active'
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {member.status === 'active' ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <UserModal
                        mode="edit"
                        userRole={member.role === 'admin' ? 'admin' : 'agent'}
                        user={member}
                        onSuccess={() => refetch()}
                        trigger={
                          <button className="text-olive hover:text-olive/80 text-sm font-medium inline-flex items-center gap-1">
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={total}
              onPageChange={setPage}
              disabled={isFetching}
            />
          </>
        )}
      </div>
    </div>
  );
}
