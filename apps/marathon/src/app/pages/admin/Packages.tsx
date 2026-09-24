import { useState } from 'react';
import { Edit2, Package, Plus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAkMarathonMutation, useAkMarathonQuery, useRenderPrice } from '@ak-marathon/sdk';
import type { BasePackage } from '@ak-marathon/sdk';
import { ApiDomainError } from '@rabstack/rab-react-sdk';
import { Button } from '../../components/ui';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PackageModal } from './components/PackageModal';

export default function PackagesPage() {
    const [packageToDelete, setPackageToDelete] = useState<BasePackage | null>(null);
    const { renderPrice } = useRenderPrice();

    const { data: packagesData, isLoading, refetch, isFetching } = useAkMarathonQuery("listPackages", {
        refetchOnWindowFocus: false,
    });
    const packages = packagesData ?? [];

    const deletePackage = useAkMarathonMutation("deletePackage", {
        onSuccess: () => {
            setPackageToDelete(null);
            toast.success('Package deleted successfully!');
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
                    <h1 className="text-2xl font-display font-bold">Packages</h1>
                    <p className="text-sm text-muted-foreground mt-1">Configure participation packages, merchandise and prizes</p>
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
                        <h3 className="font-display font-semibold text-xl">Participation Packages</h3>
                        <p className="text-sm text-muted-foreground mt-1">What communities buy into to join the race</p>
                    </div>
                    <PackageModal
                        mode="create"
                        onSuccess={() => refetch()}
                        trigger={
                            <Button size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                New Package
                            </Button>
                        }
                    />
                </div>

                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-olive"></div>
                        <p className="text-muted-foreground mt-4">Loading packages...</p>
                    </div>
                ) : packages.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">No packages configured yet.</p>
                        <PackageModal
                            mode="create"
                            onSuccess={() => refetch()}
                            trigger={
                                <Button size="sm">
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Package
                                </Button>
                            }
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Package</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Merchandise</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Prizes</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Benefits</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {packages.map((pkg) => (
                                    <tr key={pkg.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">{pkg.name}</td>
                                        <td className="px-6 py-4 font-semibold text-foreground">{renderPrice(pkg.price)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {pkg.merchandise.length === 0 ? (
                                                    <span className="text-muted-foreground text-sm">—</span>
                                                ) : (
                                                    pkg.merchandise.map((item) => (
                                                        <span
                                                            key={item.id}
                                                            title={item.description ?? undefined}
                                                            className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground font-medium"
                                                        >
                                                            {item.name}
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {pkg.prizes.length === 0 ? (
                                                    <span className="text-muted-foreground text-sm">—</span>
                                                ) : (
                                                    pkg.prizes.map((prize) => (
                                                        <span
                                                            key={prize.id}
                                                            title={prize.description ?? undefined}
                                                            className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-medium"
                                                        >
                                                            {prize.position ? `#${prize.position} ` : ''}{prize.name}
                                                            {typeof prize.amount === 'number' ? ` · ${renderPrice(prize.amount)}` : ''}
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground text-sm max-w-xs">{pkg.benefits || '—'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <PackageModal
                                                    mode="edit"
                                                    pkg={pkg}
                                                    onSuccess={() => refetch()}
                                                    trigger={
                                                        <button className="text-olive hover:text-olive/80 text-sm font-medium inline-flex items-center gap-1">
                                                            <Edit2 className="w-4 h-4" /> Edit
                                                        </button>
                                                    }
                                                />
                                                <button
                                                    onClick={() => setPackageToDelete(pkg)}
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

            {packageToDelete && (
                <ConfirmDialog
                    title="Delete Package"
                    description="This action cannot be undone"
                    message={`Are you sure you want to delete "${packageToDelete.name}"? Participants will no longer be able to buy into it.`}
                    confirmLabel="Delete"
                    isLoading={deletePackage.isPending}
                    onConfirm={() => deletePackage.mutate({ params: { id: packageToDelete.id } })}
                    onCancel={() => setPackageToDelete(null)}
                />
            )}
        </div>
    );
}
