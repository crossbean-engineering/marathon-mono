import { useState } from 'react';
import { BedDouble, Bus, Edit2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAkMarathonMutation, useAkMarathonQuery, useRenderPrice } from '@ak-marathon/sdk';
import type { BaseAddOn } from '@ak-marathon/sdk';
import { ApiDomainError } from '@rabstack/rab-react-sdk';
import { Button } from '../../components/ui';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { describeAddOn } from '../../lib/weekendPackage';
import { AddOnModal } from './components/AddOnModal';

export default function AddOnsPage() {
    const { renderPrice } = useRenderPrice();
    const [addOnToDelete, setAddOnToDelete] = useState<BaseAddOn | null>(null);

    const { data: addOnsData, isLoading, refetch, isFetching } = useAkMarathonQuery('listAddOns', {
        query: { activeOnly: false },
        refetchOnWindowFocus: false,
    });
    const addOns = addOnsData ?? [];

    const deleteAddOn = useAkMarathonMutation('deleteAddOn', {
        onSuccess: () => {
            setAddOnToDelete(null);
            toast.success('Add-on deleted');
            refetch();
        },
        onError: (error: ApiDomainError) => {
            setAddOnToDelete(null);
            toast.error(error.getAllMessages().join(', '));
        },
    });

    const newButton = (
        <AddOnModal
            mode="create"
            onSuccess={() => refetch()}
            trigger={
                <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Add-on
                </Button>
            }
        />
    );

    return (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold">Weekend Package</h1>
                    <p className="text-sm text-muted-foreground mt-1">Accommodation and transport add-ons for travelling participants</p>
                </div>
                <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isFetching}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <div>
                        <h3 className="font-display font-semibold text-xl">Add-ons</h3>
                        <p className="text-sm text-muted-foreground mt-1">Prices are per person. Bookings count pending and paid registrations.</p>
                    </div>
                    {newButton}
                </div>

                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-olive"></div>
                        <p className="text-muted-foreground mt-4">Loading add-ons...</p>
                    </div>
                ) : addOns.length === 0 ? (
                    <div className="p-12 text-center">
                        <BedDouble className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">No add-ons yet. Add accommodation or transport options to offer a Weekend Package.</p>
                        {newButton}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Add-on</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Price / person</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Booked</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Remaining</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {addOns.map((addOn) => {
                                    const Icon = addOn.type === 'accommodation' ? BedDouble : Bus;
                                    return (
                                        <tr key={addOn.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Icon className="w-4 h-4 text-olive shrink-0" />
                                                    <span className="font-medium">{describeAddOn(addOn)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-semibold">{renderPrice(addOn.price)}</td>
                                            <td className="px-6 py-4">{addOn.booked}</td>
                                            <td className="px-6 py-4">
                                                {addOn.remaining === null ? (
                                                    <span className="text-muted-foreground">Unlimited</span>
                                                ) : (
                                                    <span className={addOn.remaining === 0 ? 'text-red-600 font-semibold' : ''}>
                                                        {addOn.remaining} of {addOn.capacity}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                                    addOn.isActive ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                                                }`}>
                                                    {addOn.isActive ? 'Bookable' : 'Hidden'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <AddOnModal
                                                        mode="edit"
                                                        addOn={addOn}
                                                        onSuccess={() => refetch()}
                                                        trigger={
                                                            <button className="text-olive hover:text-olive/80 text-sm font-medium inline-flex items-center gap-1">
                                                                <Edit2 className="w-4 h-4" /> Edit
                                                            </button>
                                                        }
                                                    />
                                                    <button
                                                        onClick={() => setAddOnToDelete(addOn)}
                                                        className="text-red-500 hover:text-red-700 text-sm font-medium inline-flex items-center gap-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {addOnToDelete && (
                <ConfirmDialog
                    title="Delete Add-on"
                    description="This action cannot be undone"
                    message={`Delete "${describeAddOn(addOnToDelete)}"? Add-ons that already have bookings can't be deleted — hide them instead.`}
                    confirmLabel="Delete"
                    isLoading={deleteAddOn.isPending}
                    onConfirm={() => deleteAddOn.mutate({ params: { id: addOnToDelete.id } })}
                    onCancel={() => setAddOnToDelete(null)}
                />
            )}
        </div>
    );
}
