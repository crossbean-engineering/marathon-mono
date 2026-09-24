import { useState } from 'react';
import { Edit2, Percent, Plus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAkMarathonMutation, useAkMarathonQuery } from '@ak-marathon/sdk';
import type { BaseCoupon } from '@ak-marathon/sdk';
import { ApiDomainError } from '@rabstack/rab-react-sdk';
import { Button } from '../../components/ui';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CouponModal } from './components/CouponModal';

export default function CouponsPage() {
    const [couponToDelete, setCouponToDelete] = useState<BaseCoupon | null>(null);

    const { data: couponsData, isLoading, refetch, isFetching } = useAkMarathonQuery("listCoupons", {
        refetchOnWindowFocus: false,
    });
    const coupons = couponsData ?? [];

    const deleteCoupon = useAkMarathonMutation("deleteCoupon", {
        onSuccess: () => {
            setCouponToDelete(null);
            toast.success('Coupon deleted successfully!');
            refetch();
        },
        onError: (error: ApiDomainError) => {
            toast.error(error.getAllMessages().join(', '));
        }
    });

    return (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold">Coupons</h1>
                    <p className="text-sm text-muted-foreground mt-1">Configure discount codes for packages</p>
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

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <div>
                        <h3 className="font-display font-semibold text-xl">Discount Coupons</h3>
                        <p className="text-sm text-muted-foreground mt-1">Percent-off codes participants can apply at checkout</p>
                    </div>
                    <CouponModal
                        mode="create"
                        onSuccess={() => refetch()}
                        trigger={
                            <Button size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                New Coupon
                            </Button>
                        }
                    />
                </div>

                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-olive"></div>
                        <p className="text-muted-foreground mt-4">Loading coupons...</p>
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="p-12 text-center">
                        <Percent className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">No coupons configured yet.</p>
                        <CouponModal
                            mode="create"
                            onSuccess={() => refetch()}
                            trigger={
                                <Button size="sm">
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Coupon
                                </Button>
                            }
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Discount</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Applies To</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-mono font-medium text-foreground">{coupon.code}</td>
                                        <td className="px-6 py-4 font-semibold text-foreground">{coupon.percentOff}%</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                                coupon.isActive
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}>
                                                {coupon.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {coupon.packages.length === 0 ? (
                                                    <span className="text-muted-foreground text-sm">—</span>
                                                ) : (
                                                    coupon.packages.map((pkg) => (
                                                        <span
                                                            key={pkg.id}
                                                            className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground font-medium"
                                                        >
                                                            {pkg.name}
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <CouponModal
                                                    mode="edit"
                                                    coupon={coupon}
                                                    onSuccess={() => refetch()}
                                                    trigger={
                                                        <button className="text-olive hover:text-olive/80 text-sm font-medium inline-flex items-center gap-1">
                                                            <Edit2 className="w-4 h-4" /> Edit
                                                        </button>
                                                    }
                                                />
                                                <button
                                                    onClick={() => setCouponToDelete(coupon)}
                                                    className="text-red-500 hover:text-red-700 text-sm font-medium inline-flex items-center gap-1"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {couponToDelete && (
                <ConfirmDialog
                    title="Delete Coupon"
                    description="This action cannot be undone"
                    message={`Are you sure you want to delete "${couponToDelete.code}"? It will no longer be usable at checkout.`}
                    confirmLabel="Delete"
                    isLoading={deleteCoupon.isPending}
                    onConfirm={() => deleteCoupon.mutate({ params: { id: couponToDelete.id } })}
                    onCancel={() => setCouponToDelete(null)}
                />
            )}
        </div>
    );
}
