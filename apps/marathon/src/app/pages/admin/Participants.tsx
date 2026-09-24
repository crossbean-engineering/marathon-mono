import { useAkMarathonQuery } from '@ak-marathon/sdk';
import type { BaseParticipant, ParticipantStatus, Gender } from '@ak-marathon/sdk';
import { useMemo, useState } from 'react';
import { Button } from '../../components/ui';
import { RefreshCw, Search, X, Download, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from '../../components/Pagination';
import { SHIRT_SIZES } from '../../types/packages';
import { exportParticipants } from '../../lib/exportParticipants';
import { useApiBaseUrl } from '../../contexts/ApiConfigContext';
import { toast } from 'sonner';

type StatusFilter = ParticipantStatus | 'all';
type GenderFilter = Gender | 'all';
type ShirtSizeFilter = (typeof SHIRT_SIZES)[number] | 'all';

const PAGE_SIZE = 10;

export default function ParticipantPage() {
    const navigate = useNavigate();
    const baseUrl = useApiBaseUrl();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
    const [shirtSizeFilter, setShirtSizeFilter] = useState<ShirtSizeFilter>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

    const query = {
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(genderFilter !== 'all' ? { gender: genderFilter } : {}),
        ...(shirtSizeFilter !== 'all' ? { shirtSize: shirtSizeFilter } : {}),
    };

    const { data: participantsData, isLoading, refetch, isFetching } = useAkMarathonQuery("listParticipants", {
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        query,
    });

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportParticipants(baseUrl, query);
        } catch {
            toast.error('Failed to export participants');
        } finally {
            setIsExporting(false);
        }
    };

    const allParticipants = useMemo(() => participantsData ?? [], [participantsData]);

    // Client-side search (the API returns the full filtered list)
    const filteredParticipants = useMemo(() => {
        if (!searchTerm.trim()) return allParticipants;
        const needle = searchTerm.trim().toLowerCase();
        return allParticipants.filter((p: BaseParticipant) =>
            p.name.toLowerCase().includes(needle) ||
            p.code.toLowerCase().includes(needle) ||
            (p.wristbandCode ?? '').toLowerCase().includes(needle)
        );
    }, [allParticipants, searchTerm]);

    const total = filteredParticipants.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(currentPage, totalPages);
    const participants = filteredParticipants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Calculate stats
    const stats = useMemo(() => ({
        total: allParticipants.length,
        active: allParticipants.filter((p) => p.status === 'active').length,
        pending: allParticipants.filter((p) => p.status === 'pending').length,
        withWristband: allParticipants.filter((p) => !!p.wristbandCode).length,
    }), [allParticipants]);

    return (
        <div className='container mx-auto px-4 py-6 max-w-7xl'>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-display font-bold">Participant Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">View and manage race participants</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleExport}
                        variant="outline"
                        size="sm"
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4 mr-2" />
                        )}
                        Export
                    </Button>
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
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div
                    className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-border/60 transition-colors"
                    onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                >
                    <p className="text-sm text-muted-foreground mb-1">Total Participants</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div
                    className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-green-300 transition-colors"
                    onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
                >
                    <p className="text-sm text-muted-foreground mb-1">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div
                    className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-yellow-300 transition-colors"
                    onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
                >
                    <p className="text-sm text-muted-foreground mb-1">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div
                    className="bg-card border border-border rounded-lg p-4 hover:border-olive/40 transition-colors"
                >
                    <p className="text-sm text-muted-foreground mb-1">With Wristband</p>
                    <p className="text-2xl font-bold text-olive">{stats.withWristband}</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by name, code, or wristband code..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-10 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setCurrentPage(1); }}
                        className="px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                    </select>
                    <select
                        value={genderFilter}
                        onChange={(e) => { setGenderFilter(e.target.value as GenderFilter); setCurrentPage(1); }}
                        className="px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive"
                    >
                        <option value="all">All Genders</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                    <select
                        value={shirtSizeFilter}
                        onChange={(e) => { setShirtSizeFilter(e.target.value as ShirtSizeFilter); setCurrentPage(1); }}
                        className="px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive"
                    >
                        <option value="all">All Sizes</option>
                        {SHIRT_SIZES.map((size) => (
                            <option key={size} value={size}>{size.toUpperCase()}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Participants Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/30 border-b border-border">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Participant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Package</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Wristband</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Registered</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5 text-olive" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="text-muted-foreground">Loading participants...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : participants.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                        No participants found
                                    </td>
                                </tr>
                            ) : (
                                participants.map((participant: BaseParticipant) => (
                                    <tr key={participant.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{participant.name}</div>
                                            <div className="text-xs text-muted-foreground font-mono">{participant.code}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-muted-foreground">
                                                {participant.package?.name ?? '—'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-muted-foreground">
                                                {participant.shirtSize && (
                                                    <span className="uppercase">{participant.shirtSize}</span>
                                                )}
                                                {participant.shirtSize && participant.gender && ' · '}
                                                {participant.gender && (
                                                    <span className="capitalize">{participant.gender}</span>
                                                )}
                                                {!participant.shirtSize && !participant.gender && '—'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {participant.wristbandCode ? (
                                                <div>
                                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-olive/10 text-olive">
                                                        Assigned
                                                    </span>
                                                    <div className="text-xs text-muted-foreground font-mono mt-1">
                                                        {participant.wristbandCode}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Not assigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                                                participant.status === 'active'
                                                    ? 'bg-green-100 text-green-700'
                                                    : participant.status === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {participant.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(participant.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => navigate(`/admin/participants/${participant.id}`)}
                                                className="text-sm text-olive hover:text-olive/80 font-medium"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    total={total}
                    onPageChange={setCurrentPage}
                    disabled={isFetching}
                />
            </div>
        </div>
    );
}
