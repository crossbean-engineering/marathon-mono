import { useState, ReactNode } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAkMarathonMutation, useAkMarathonQuery } from '@ak-marathon/sdk';
import type { BaseCoupon } from '@ak-marathon/sdk';
import { ApiDomainError } from '@rabstack/rab-react-sdk';
import { Button } from '../../../components/ui';
import { BaseModal } from '../../../components/BaseModal';

type CouponForm = {
    percentOff: number;
    isActive: boolean;
    packageIds: string[];
};

const emptyForm = (): CouponForm => ({
    percentOff: 10,
    isActive: true,
    packageIds: [],
});

const toForm = (coupon: BaseCoupon): CouponForm => ({
    percentOff: coupon.percentOff,
    isActive: coupon.isActive,
    packageIds: coupon.packages.map((pkg) => pkg.id),
});

const inputCls = 'w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive';
const labelCls = 'block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1';

interface CouponModalProps {
    mode: 'create' | 'edit';
    coupon?: BaseCoupon;
    trigger: ReactNode;
    onSuccess: () => void;
}

export function CouponModal({ mode, coupon, trigger, onSuccess }: CouponModalProps) {
    const [form, setForm] = useState<CouponForm>(coupon ? toForm(coupon) : emptyForm());
    const [saving, setSaving] = useState(false);

    const { data: packagesData } = useAkMarathonQuery('listPackages', {
        refetchOnWindowFocus: false,
    });
    const packages = packagesData ?? [];

    const createCoupon = useAkMarathonMutation('createCoupon');
    const updateCoupon = useAkMarathonMutation('updateCoupon');

    const togglePackage = (packageId: string) => {
        setForm((f) => ({
            ...f,
            packageIds: f.packageIds.includes(packageId)
                ? f.packageIds.filter((id) => id !== packageId)
                : [...f.packageIds, packageId],
        }));
    };

    const handleSave = async (closeModal: () => void) => {
        if (form.percentOff <= 0 || form.percentOff > 100) {
            toast.error('Percent off must be between 1 and 100');
            return;
        }
        if (form.packageIds.length === 0) {
            toast.error('Select at least one package this coupon applies to');
            return;
        }

        setSaving(true);
        try {
            const body = {
                percentOff: form.percentOff,
                isActive: form.isActive,
                packageIds: form.packageIds,
            };

            if (mode === 'create') {
                await createCoupon.mutateAsync({ body });
                toast.success('Coupon created successfully!');
                setForm(emptyForm());
            } else if (coupon) {
                await updateCoupon.mutateAsync({ params: { id: coupon.id }, body });
                toast.success('Coupon updated successfully!');
            }

            onSuccess();
            closeModal();
        } catch (error) {
            const msg = error instanceof ApiDomainError
                ? error.getAllMessages().join(', ')
                : 'Failed to save coupon';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <BaseModal
            trigger={trigger}
            title={mode === 'create' ? 'Create Coupon' : 'Edit Coupon'}
            description={mode === 'create' ? 'Add a new discount coupon' : 'Update coupon configuration'}
            maxWidth="lg"
        >
            {(closeModal) => (
                <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
                    {mode === 'edit' && coupon && (
                        <div>
                            <label className={labelCls}>Code</label>
                            <p className="font-mono text-lg font-semibold">{coupon.code}</p>
                        </div>
                    )}

                    {/* Percent off & active */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Percent Off</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={form.percentOff}
                                    onChange={(e) => setForm({ ...form, percentOff: Number(e.target.value) })}
                                    className={`${inputCls} pr-8`}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Status</label>
                            <label className="flex items-center gap-2 h-[42px] px-4 border border-input rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.isActive}
                                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">{form.isActive ? 'Active' : 'Inactive'}</span>
                            </label>
                        </div>
                    </div>

                    {/* Applicable packages */}
                    <div>
                        <label className={labelCls}>Applies To</label>
                        {packages.length === 0 ? (
                            <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">No packages configured yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {packages.map((pkg) => (
                                    <label
                                        key={pkg.id}
                                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form.packageIds.includes(pkg.id)}
                                            onChange={() => togglePackage(pkg.id)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm font-medium">{pkg.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button onClick={closeModal} variant="outline" className="flex-1" disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={() => handleSave(closeModal)} className="flex-1" disabled={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Saving...' : mode === 'create' ? 'Create Coupon' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            )}
        </BaseModal>
    );
}
