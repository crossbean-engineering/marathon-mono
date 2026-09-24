import { useState, ReactNode } from 'react';
import { Plus, Save, Trash2, Gift, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { useAkMarathonMutation } from '@ak-marathon/sdk';
import type { BasePackage } from '@ak-marathon/sdk';
import { ApiDomainError } from '@rabstack/rab-react-sdk';
import { Button } from '../../../components/ui';
import { BaseModal } from '../../../components/BaseModal';

type MerchandiseItem = {
    id: string;
    name: string;
    description: string;
    isNew: boolean;
};

type PrizeItem = {
    id: string;
    name: string;
    amount: number; // GH₵ in the form
    position: number;
    description: string;
    isNew: boolean;
};

type PackageForm = {
    name: string;
    price: number; // GH₵ in the form
    benefits: string;
    items: MerchandiseItem[];
    prizes: PrizeItem[];
};

const emptyForm = (): PackageForm => ({
    name: '',
    price: 0,
    benefits: '',
    items: [],
    prizes: [],
});

const toForm = (pkg: BasePackage): PackageForm => ({
    name: pkg.name,
    price: pkg.price / 100,
    benefits: pkg.benefits ?? '',
    items: pkg.merchandise.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description ?? '',
        isNew: false,
    })),
    prizes: pkg.prizes.map((prize) => ({
        id: prize.id,
        name: prize.name,
        amount: (prize.amount ?? 0) / 100,
        position: prize.position ?? 0,
        description: prize.description ?? '',
        isNew: false,
    })),
});

const newId = () => `tmp-${Math.random().toString(36).slice(2, 10)}`;

const inputCls = 'w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive';
const labelCls = 'block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1';

interface PackageModalProps {
    mode: 'create' | 'edit';
    pkg?: BasePackage;
    trigger: ReactNode;
    onSuccess: () => void;
}

export function PackageModal({ mode, pkg, trigger, onSuccess }: PackageModalProps) {
    const [form, setForm] = useState<PackageForm>(pkg ? toForm(pkg) : emptyForm());
    const [saving, setSaving] = useState(false);

    const createMerchandise = useAkMarathonMutation('createMerchandise');
    const createPackage = useAkMarathonMutation('createPackage');
    const updatePackage = useAkMarathonMutation('updatePackage');

    const updateItem = (index: number, patch: Partial<MerchandiseItem>) => {
        setForm((f) => ({
            ...f,
            items: f.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
        }));
    };

    const updatePrize = (index: number, patch: Partial<PrizeItem>) => {
        setForm((f) => ({
            ...f,
            prizes: f.prizes.map((prize, i) => (i === index ? { ...prize, ...patch } : prize)),
        }));
    };

    const handleSave = async (closeModal: () => void) => {
        if (!form.name.trim()) {
            toast.error('Please enter a package name');
            return;
        }
        if (form.price <= 0) {
            toast.error('Price must be greater than 0');
            return;
        }
        if (form.items.some((item) => !item.name.trim())) {
            toast.error('Every merchandise item needs a name');
            return;
        }
        if (form.prizes.some((prize) => !prize.name.trim())) {
            toast.error('Every prize needs a name');
            return;
        }

        setSaving(true);
        try {
            // Create any new merchandise items first so we can pass their ids
            const merchandiseIds: string[] = [];
            for (const item of form.items) {
                if (item.isNew) {
                    const created = await createMerchandise.mutateAsync({
                        body: {
                            name: item.name.trim(),
                            ...(item.description.trim() ? { description: item.description.trim() } : {}),
                        },
                    });
                    merchandiseIds.push(created.id);
                } else {
                    merchandiseIds.push(item.id);
                }
            }

            const prizes = form.prizes.map((prize) => ({
                ...(prize.isNew ? {} : { id: prize.id }),
                name: prize.name.trim(),
                amount: Math.round(prize.amount * 100),
                position: prize.position,
                ...(prize.description.trim() ? { description: prize.description.trim() } : {}),
            }));

            const body = {
                name: form.name.trim(),
                price: Math.round(form.price * 100),
                ...(form.benefits.trim() ? { benefits: form.benefits.trim() } : {}),
                merchandiseIds,
                prizes,
            };

            if (mode === 'create') {
                await createPackage.mutateAsync({ body });
                toast.success('Package created successfully!');
                setForm(emptyForm());
            } else if (pkg) {
                await updatePackage.mutateAsync({ params: { id: pkg.id }, body });
                toast.success('Package updated successfully!');
            }

            onSuccess();
            closeModal();
        } catch (error) {
            const msg = error instanceof ApiDomainError
                ? error.getAllMessages().join(', ')
                : 'Failed to save package';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <BaseModal
            trigger={trigger}
            title={mode === 'create' ? 'Create Package' : 'Edit Package'}
            description={mode === 'create' ? 'Add a new participation package' : 'Update package configuration'}
            maxWidth="xl"
        >
            {(closeModal) => (
                <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
                    {/* Name & Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Package Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Individual Runner"
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Price (GH₵)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₵</span>
                                <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                                    className={`${inputCls} pl-8`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Benefits */}
                    <div>
                        <label className={labelCls}>Benefits</label>
                        <textarea
                            value={form.benefits}
                            onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                            rows={2}
                            placeholder="What does this package give participants?"
                            className={`${inputCls} resize-none`}
                        />
                    </div>

                    {/* Merchandise items */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Gift className="w-4 h-4 text-muted-foreground" />
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Merchandise</label>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setForm({ ...form, items: [...form.items, { id: newId(), name: '', description: '', isNew: true }] })}
                            >
                                <Plus className="w-4 h-4 mr-1" /> Add Item
                            </Button>
                        </div>
                        {form.items.length === 0 ? (
                            <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">No merchandise items yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {form.items.map((item, index) => (
                                    <div key={item.id} className="flex gap-2 items-start p-3 bg-muted/30 rounded-lg">
                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => updateItem(index, { name: e.target.value })}
                                                placeholder="Name (e.g. Race Bib)"
                                                disabled={!item.isNew}
                                                className={`${inputCls} disabled:opacity-60`}
                                            />
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateItem(index, { description: e.target.value })}
                                                placeholder="Description"
                                                disabled={!item.isNew}
                                                className={`${inputCls} disabled:opacity-60`}
                                            />
                                        </div>
                                        <button
                                            onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })}
                                            className="text-red-500 hover:text-red-700 p-2"
                                            aria-label="Remove item"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Prizes */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-muted-foreground" />
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prizes</label>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setForm({
                                    ...form,
                                    prizes: [...form.prizes, { id: newId(), name: '', amount: 0, position: form.prizes.length + 1, description: '', isNew: true }],
                                })}
                            >
                                <Plus className="w-4 h-4 mr-1" /> Add Prize
                            </Button>
                        </div>
                        {form.prizes.length === 0 ? (
                            <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">No prizes yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {form.prizes.map((prize, index) => (
                                    <div key={prize.id} className="flex gap-2 items-start p-3 bg-muted/30 rounded-lg">
                                        <div className="flex-1 space-y-2">
                                            <div className="grid grid-cols-3 gap-2">
                                                <input
                                                    type="text"
                                                    value={prize.name}
                                                    onChange={(e) => updatePrize(index, { name: e.target.value })}
                                                    placeholder="Name (e.g. Fastest Group)"
                                                    className={inputCls}
                                                />
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₵</span>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        value={prize.amount}
                                                        onChange={(e) => updatePrize(index, { amount: Number(e.target.value) })}
                                                        placeholder="Amount"
                                                        className={`${inputCls} pl-8`}
                                                    />
                                                </div>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={prize.position}
                                                    onChange={(e) => updatePrize(index, { position: Number(e.target.value) })}
                                                    placeholder="Position"
                                                    className={inputCls}
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                value={prize.description}
                                                onChange={(e) => updatePrize(index, { description: e.target.value })}
                                                placeholder="Description"
                                                className={inputCls}
                                            />
                                        </div>
                                        <button
                                            onClick={() => setForm({ ...form, prizes: form.prizes.filter((_, i) => i !== index) })}
                                            className="text-red-500 hover:text-red-700 p-2"
                                            aria-label="Remove prize"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
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
                            {saving ? 'Saving...' : mode === 'create' ? 'Create Package' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            )}
        </BaseModal>
    );
}
