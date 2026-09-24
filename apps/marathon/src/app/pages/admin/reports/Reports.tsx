import { useAkMarathonQuery, useRenderPrice } from '@ak-marathon/sdk';
import { RefreshCw, Package } from 'lucide-react';
import { Button } from '../../../components/ui';

export default function ReportsPage() {
    const { renderPrice } = useRenderPrice();

    const { data: reportsData, isLoading, refetch, isFetching } = useAkMarathonQuery('reports', {
        query: { reportType: 'package_performance' },
        refetchOnWindowFocus: false,
    });

    const rows = reportsData?.rows ?? [];
    const totals = rows.reduce(
        (acc, row) => ({
            participants: acc.participants + row.participants,
            revenuePesewas: acc.revenuePesewas + row.revenuePesewas,
        }),
        { participants: 0, revenuePesewas: 0 },
    );

    return (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-display font-bold">Reports</h1>
                    <p className="text-sm text-muted-foreground mt-1">Participants and revenue per package</p>
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

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 mb-6 max-w-xl">
                <div className="bg-card border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Total Participants</p>
                    <p className="text-2xl font-bold">{totals.participants.toLocaleString()}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-olive">{renderPrice(totals.revenuePesewas)}</p>
                </div>
            </div>

            {/* Per-package table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/30 border-b border-border">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Package</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Participants</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5 text-olive" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="text-muted-foreground">Loading report...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                                        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        No report data yet
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => (
                                    <tr key={row.packageId} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">{row.name}</td>
                                        <td className="px-6 py-4 text-right">{row.participants.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-semibold">{renderPrice(row.revenuePesewas)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
