import { useAkMarathonQuery } from '@ak-marathon/sdk';
import type { BaseUser } from '@ak-marathon/sdk';
import { useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from '../../components/Pagination';

const PAGE_SIZE = 10;

type StatusFilter = 'all' | 'active' | 'suspended';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Fetch regular user accounts only (staff live on /admin/staff)
  const {
    data: usersData,
    isLoading,
    isFetching,
    refetch
  } = useAkMarathonQuery("listUsers", {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    query: { role: 'user' },
  });

  // Client-side status filter, search + pagination (the API returns the full list)
  const filteredUsers = useMemo(() => {
    let all = usersData ?? [];
    if (statusFilter !== 'all') {
      all = all.filter((u: BaseUser) => u.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const needle = searchTerm.trim().toLowerCase();
      all = all.filter((u: BaseUser) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(needle) ||
        u.phone.toLowerCase().includes(needle) ||
        (u.email ?? '').toLowerCase().includes(needle)
      );
    }
    return all;
  }, [usersData, statusFilter, searchTerm]);

  const total = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const users = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-foreground">Users</h2>
        <p className="text-muted-foreground mt-1">
          Registered user accounts on the platform
        </p>
      </div>

      <div className="bg-card rounded-xl shadow-md border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex flex-wrap justify-between items-center gap-3">
          <div>
            <h3 className="font-display font-semibold text-xl">All Users</h3>
            <p className="text-sm text-muted-foreground mt-1">
              People who signed up — separate from staff accounts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                placeholder="Search users..."
                className="pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring w-44"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
              className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span className='hidden md:block'>Refresh</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-olive"></div>
            <p className="text-muted-foreground mt-4">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No users found.</p>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user: BaseUser) => (
                    <tr
                      key={user.id}
                      onClick={() => navigate(`/admin/users/${user.id}`)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-medium text-foreground">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{user.phone}</td>
                      <td className="px-6 py-4 text-muted-foreground">{user.email || '-'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-medium ${
                            user.status === 'active'
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.status === 'active' ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
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
    </>
  );
}
