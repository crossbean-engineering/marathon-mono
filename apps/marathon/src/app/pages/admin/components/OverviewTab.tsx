import { useAkMarathonQuery, useRenderPrice } from '@ak-marathon/sdk';
import type { BasePayment } from '@ak-marathon/sdk';
import { ArrowDownLeft, Loader2 } from 'lucide-react';
import { UserModal } from './userModal';

export default function OverviewTab() {
  const { data: paymentsData, isLoading } = useAkMarathonQuery("listPayments", {
    refetchOnWindowFocus: false,
  });

  const { renderPrice } = useRenderPrice();
  const payments = (paymentsData ?? []).slice(0, 5);

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
     <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent Payments */}
            <div className="lg:col-span-2 bg-card rounded-xl shadow-md border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="font-display font-semibold text-xl">Recent Payments</h3>
              </div>
              <div className="divide-y divide-border">
                {isLoading ? (
                  <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading payments...</span>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No payments yet
                  </div>
                ) : (
                  payments.map((payment: BasePayment) => (
                    <div key={payment.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-green-100">
                          <ArrowDownLeft className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-foreground truncate font-mono text-sm">
                              {payment.transactionId}
                            </p>
                            <span className="text-sm font-semibold whitespace-nowrap text-green-600">
                              +{renderPrice(payment.amount)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${statusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize">{payment.paymentMethod}</span>
                            {payment.network && (
                              <span className="text-xs text-muted-foreground">{payment.network}</span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(payment.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <div className="bg-card rounded-xl shadow-md border border-border p-6">
                <h3 className="font-display font-semibold text-lg mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <UserModal
                    userRole="agent"
                    trigger={
                      <button className="w-full py-3 px-4 bg-olive text-primary-foreground rounded-lg font-medium hover:bg-olive/90 transition-colors text-left flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Onboard New Agent
                      </button>
                    }
                  />
                  <UserModal
                    userRole="admin"
                    trigger={
                      <button className="w-full py-3 px-4 bg-golden text-primary-foreground rounded-lg font-medium hover:bg-golden/90 transition-colors text-left flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Onboard New Admin
                      </button>
                    }
                  />
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-md border border-border p-6">
                <h3 className="font-display font-semibold text-lg mb-4">System Health</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">API Status</span>
                    <span className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Online
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Database</span>
                    <span className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Connected
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Payment Gateway</span>
                    <span className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
  )
}
