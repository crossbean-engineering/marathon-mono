import { useAkMarathonMutation, useAkMarathonQuery } from '@ak-marathon/sdk'
import type { BaseWristband, WristbandStatus } from '@ak-marathon/sdk'
import { ApiDomainError } from '@rabstack/rab-react-sdk'
import { useMemo, useState } from 'react'
import { Button } from '../../components/ui';
import { RefreshCw, QrCode, Printer, CircleCheck, CheckCircle, FileText, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useGenerateWristbandPdf } from '../../hooks/useGenerateWristbandPdf';
import { Pagination } from '../../components/Pagination';

const PAGE_SIZE = 10;

export default function WristbandPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | WristbandStatus>('all');
    const [generateCount, setGenerateCount] = useState(10);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printCount, setPrintCount] = useState(24);
    const [marking, setMarking] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const { data: wristbandsData, isLoading, refetch, isFetching } = useAkMarathonQuery("listWristbands", {
        refetchOnWindowFocus: false,
    });

    const allWristbands = useMemo(() => wristbandsData ?? [], [wristbandsData]);

    // Client-side stats (the API returns the full list)
    const stats = useMemo(() => ({
        total: allWristbands.length,
        available: allWristbands.filter((w) => w.status === 'available').length,
        redeemed: allWristbands.filter((w) => w.status === 'redeemed').length,
        disabled: allWristbands.filter((w) => w.status === 'disabled').length,
        printed: allWristbands.filter((w) => w.isPrinted).length,
    }), [allWristbands]);

    // Client-side filters + pagination
    const filteredWristbands = useMemo(() => {
        let rows = allWristbands;
        if (statusFilter !== 'all') rows = rows.filter((w) => w.status === statusFilter);
        if (searchTerm.trim()) {
            const needle = searchTerm.trim().toLowerCase();
            rows = rows.filter((w) => w.code.toLowerCase().includes(needle));
        }
        return rows;
    }, [allWristbands, statusFilter, searchTerm]);

    const total = filteredWristbands.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(currentPage, totalPages);
    const wristbands = filteredWristbands.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const generateWristband = useAkMarathonMutation("generateWristbands", {
        onSuccess: (data) => {
            refetch();
            setShowGenerateModal(false);
            toast.success(`Successfully generated ${data.generated} wristbands!`);
        },
        onError: (error: ApiDomainError) => {
            toast.error(error.getAllMessages().join(', '));
        }
    });

    const updateWristband = useAkMarathonMutation("updateWristband");

    const { generatePDF, loading: pdfLoading } = useGenerateWristbandPdf();

    const handleGenerateWristband = () => {
        generateWristband.mutate({ body: { count: generateCount } });
    };

    const handlePrintBatch = async () => {
        const toPrint = allWristbands
            .filter((w) => !w.isPrinted && w.status === 'available')
            .slice(0, printCount);

        if (toPrint.length === 0) {
            toast.error('No available unprinted wristbands. Generate wristbands first.');
            return;
        }

        setShowPrintModal(false);
        const baseUrl = window.location.origin;
        await generatePDF({
            wristbands: toPrint.map((w) => ({ code: w.code })),
            baseUrl,
        });

        // Mark the batch as printed
        try {
            setMarking(true);
            await Promise.all(
                toPrint.map((w) =>
                    updateWristband.mutateAsync({ params: { id: w.id }, body: { isPrinted: true } })
                )
            );
            refetch();
        } catch {
            toast.error('PDF generated, but some wristbands could not be marked as printed');
        } finally {
            setMarking(false);
        }
    };

    const statusBadge = (status: WristbandStatus) => {
        const styles: Record<WristbandStatus, string> = {
            available: 'bg-green-100 text-green-700',
            redeemed: 'bg-olive/10 text-olive',
            disabled: 'bg-red-100 text-red-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className='container mx-auto px-4 py-6 max-w-7xl'>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-display font-bold">Wristband Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">Generate and manage event wristbands</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => refetch()}
                        variant="outline"
                        size="sm"
                        disabled={isFetching}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => setShowPrintModal(true)}
                        variant="outline"
                        size="sm"
                        disabled={pdfLoading || marking}
                    >
                        <Printer className={`w-4 h-4 mr-2 ${(pdfLoading || marking) ? 'animate-pulse' : ''}`} />
                        {pdfLoading ? 'Generating PDF...' : marking ? 'Marking printed...' : 'Print Batch'}
                    </Button>
                    <Button
                        onClick={() => setShowGenerateModal(true)}
                        size="sm"
                    >
                        + Generate Wristbands
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div
                    className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-border/60 transition-colors"
                    onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <QrCode className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Total Wristbands</p>
                    </div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div
                    className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-green-300 transition-colors"
                    onClick={() => { setStatusFilter('available'); setCurrentPage(1); }}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <CircleCheck className="w-4 h-4 text-green-600" />
                        <p className="text-sm text-muted-foreground">Available</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{stats.available}</p>
                </div>
                <div
                    className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-olive/40 transition-colors"
                    onClick={() => { setStatusFilter('redeemed'); setCurrentPage(1); }}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-olive" />
                        <p className="text-sm text-muted-foreground">Redeemed</p>
                    </div>
                    <p className="text-2xl font-bold text-olive">{stats.redeemed}</p>
                </div>
                <div
                    className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-blue-300 transition-colors"
                    onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <p className="text-sm text-muted-foreground">Printed</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{stats.printed}</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by wristband code..."
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
                        onChange={(e) => { setStatusFilter(e.target.value as 'all' | WristbandStatus); setCurrentPage(1); }}
                        className="px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive"
                    >
                        <option value="all">All Status</option>
                        <option value="available">Available</option>
                        <option value="redeemed">Redeemed</option>
                        <option value="disabled">Disabled</option>
                    </select>
                </div>
            </div>

            {/* Wristbands Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/30 border-b border-border">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Printed</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Participant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Created</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5 text-olive" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="text-muted-foreground">Loading wristbands...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : wristbands.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        No wristbands found
                                    </td>
                                </tr>
                            ) : (
                                wristbands.map((wristband: BaseWristband) => (
                                    <tr key={wristband.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-mono font-medium">{wristband.code}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${statusBadge(wristband.status)}`}>
                                                {wristband.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm ${wristband.isPrinted ? 'text-blue-600 font-medium' : 'text-muted-foreground'}`}>
                                                {wristband.isPrinted ? 'Printed' : 'Not printed'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {wristband.participantId ? (
                                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-olive/10 text-olive">
                                                    Linked
                                                </span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(wristband.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => navigate(`/admin/wristbands/${wristband.id}`)}
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

            {/* Generate Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl shadow-xl border border-border p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Generate Wristbands</h3>
                        <label className="block text-sm font-medium mb-2">Number of wristbands</label>
                        <input
                            type="number"
                            min={1}
                            max={1000}
                            value={generateCount}
                            onChange={(e) => setGenerateCount(Number(e.target.value))}
                            className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive mb-4"
                        />
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setShowGenerateModal(false)}
                                variant="outline"
                                className="flex-1"
                                disabled={generateWristband.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleGenerateWristband}
                                className="flex-1"
                                disabled={generateWristband.isPending || generateCount < 1}
                            >
                                {generateWristband.isPending ? 'Generating...' : 'Generate'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Modal */}
            {showPrintModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl shadow-xl border border-border p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-1">Print Batch</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Generates a PDF of unprinted available wristbands and marks them as printed.
                        </p>
                        <label className="block text-sm font-medium mb-2">Number of wristbands</label>
                        <input
                            type="number"
                            min={1}
                            max={500}
                            value={printCount}
                            onChange={(e) => setPrintCount(Number(e.target.value))}
                            className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive mb-4"
                        />
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setShowPrintModal(false)}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePrintBatch}
                                className="flex-1"
                                disabled={printCount < 1}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
