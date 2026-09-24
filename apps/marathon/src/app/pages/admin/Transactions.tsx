import { useAkMarathonQuery, useRenderPrice } from '@ak-marathon/sdk';
import type { BasePayment, PaymentMethod, PaymentStatus } from '@ak-marathon/sdk';
import { useMemo, useState } from 'react';
import { Button } from '../../components/ui';
import { RefreshCw } from 'lucide-react';
import { Pagination } from '../../components/Pagination';

type StatusFilter = PaymentStatus | 'all';
type PaymentMethodFilter = PaymentMethod | 'all';

const PAGE_SIZE = 10;

export default function PaymentsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethodFilter>('all');
    const [currentPage, setCurrentPage] = useState(1);

    const { renderPrice } = useRenderPrice();

    const { data: paymentsData, isLoading, refetch, isFetching } = useAkMarathonQuery("listPayments", {
        refetchOnWindowFocus: false,
        query: {
            ...(statusFilter !== 'all' && { status: statusFilter }),
            ...(paymentMethodFilter !== 'all' && { method: paymentMethodFilter }),
        },
    });

    const allPayments = useMemo(() => paymentsData ?? [], [paymentsData]);

    const filteredPayments = useMemo(() => {
        if (!searchTerm) return allPayments;
        const needle = searchTerm.toLowerCase();
        return allPayments.filter((p: BasePayment) => (
            p.id.toLowerCase().includes(needle) ||
            p.transactionId?.toLowerCase().includes(needle) ||
            p.orderId?.toLowerCase().includes(needle) ||
            p.momoNumber?.toLowerCase().includes(needle)
        ));
    }, [allPayments, searchTerm]);

    const total = filteredPayments.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(currentPage, totalPages);
    const payments = filteredPayments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const statusBadge = (status: PaymentStatus) => {
        const styles: Record<PaymentStatus, string> = {
            completed: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            failed: 'bg-red-100 text-red-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-display font-bold">Payments</h1>
                    <p className="text-sm text-muted-foreground mt-1">View all package purchase payments</p>
                </div>
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

            {/* Search and Filters */}
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search by ID, order, or momo number..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setCurrentPage(1); }}
                        className="px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive"
                    >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>
                    <select
                        value={paymentMethodFilter}
                        onChange={(e) => { setPaymentMethodFilter(e.target.value as PaymentMethodFilter); setCurrentPage(1); }}
                        className="px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive"
                    >
                        <option value="all">All Methods</option>
                        <option value="cash">Cash</option>
                        <option value="momo">MoMo</option>
                        <option value="card">Card</option>
                    </select>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/30 border-b border-border">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Payment</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">MoMo Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Network</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
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
                                            <span className="text-muted-foreground">Loading payments...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                        No payments found
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment: BasePayment) => (
                                    <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium font-mono">{payment.transactionId || '—'}</div>
                                            <div className="text-xs text-muted-foreground font-mono truncate max-w-35">{payment.orderId}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-foreground font-mono">{payment.momoNumber || '—'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-foreground">{payment.network || '—'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-foreground capitalize">{payment.paymentMethod || '—'}</div>
                                            {payment.provider && (
                                                <div className="text-xs text-muted-foreground">{payment.provider}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-green-600">
                                                +{renderPrice(payment.amount)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusBadge(payment.status)}`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(payment.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(payment.createdAt).toLocaleTimeString()}
                                            </div>
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
