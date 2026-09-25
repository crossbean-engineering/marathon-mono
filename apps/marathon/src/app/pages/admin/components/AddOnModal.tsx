import { useState, ReactNode } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAkMarathonMutation } from '@ak-marathon/sdk';
import type { AddOnType, BaseAddOn } from '@ak-marathon/sdk';
import { ApiDomainError } from '@rabstack/rab-react-sdk';
import { Button } from '../../../components/ui';
import { BaseModal } from '../../../components/BaseModal';

type AddOnForm = {
    type: AddOnType;
    provider: string;
    name: string;
    description: string;
    occupancy: string; // accommodation only
    price: number; // GH₵ per person in the form
    capacity: string; // blank = unlimited
    isActive: boolean;
};

const emptyForm = (): AddOnForm => ({
    type: 'accommodation',
    provider: '',
    name: '',
    description: '',
    occupancy: '1',
    price: 0,
    capacity: '',
    isActive: true,
});

const toForm = (addOn: BaseAddOn): AddOnForm => ({
    type: addOn.type,
    provider: addOn.provider ?? '',
    name: addOn.name,
    description: addOn.description ?? '',
    occupancy: addOn.occupancy ? String(addOn.occupancy) : '',
    price: addOn.price / 100,
    capacity: addOn.capacity ? String(addOn.capacity) : '',
    isActive: addOn.isActive,
});

const inputCls = 'w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive';
const labelCls = 'block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1';

interface AddOnModalProps {
    mode: 'create' | 'edit';
    addOn?: BaseAddOn;
    trigger: ReactNode;
    onSuccess: () => void;
}

export function AddOnModal({ mode, addOn, trigger, onSuccess }: AddOnModalProps) {
    const [form, setForm] = useState<AddOnForm>(addOn ? toForm(addOn) : emptyForm());
    const [saving, setSaving] = useState(false);

    const createAddOn = useAkMarathonMutation('createAddOn');
    const updateAddOn = useAkMarathonMutation('updateAddOn');

    const isRoom = form.type === 'accommodation';

    const handleSave = async (closeModal: () => void) => {
        if (!form.name.trim()) {
            toast.error('Name is required');
            return;
        }
        if (form.price < 0) {
            toast.error('Price cannot be negative');
            return;
        }
        const occupancy = Number(form.occupancy);
        if (isRoom && (!Number.isInteger(occupancy) || occupancy < 1)) {
            toast.error('Enter how many people share the room');
            return;
        }
        const capacity = form.capacity.trim() ? Number(form.capacity) : null;
        if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) {
            toast.error('Capacity must be a whole number, or blank for unlimited');
            return;
        }

        setSaving(true);
        try {
            const price = Math.round(form.price * 100);
            if (mode === 'create') {
                await createAddOn.mutateAsync({
                    body: {
                        type: form.type,
                        name: form.name.trim(),
                        ...(form.provider.trim() ? { provider: form.provider.trim() } : {}),
                        ...(form.description.trim() ? { description: form.description.trim() } : {}),
                        ...(isRoom ? { occupancy } : {}),
                        price,
                        ...(capacity !== null ? { capacity } : {}),
                        isActive: form.isActive,
                    },
                });
                toast.success('Add-on created');
                setForm(emptyForm());
            } else if (addOn) {
                await updateAddOn.mutateAsync({
                    params: { id: addOn.id },
                    body: {
                        name: form.name.trim(),
                        provider: form.provider.trim() || null,
                        description: form.description.trim() || null,
                        ...(isRoom ? { occupancy } : {}),
                        price,
                        capacity,
                        isActive: form.isActive,
                    },
                });
                toast.success('Add-on updated');
            }

            onSuccess();
            closeModal();
        } catch (error) {
            const msg = error instanceof ApiDomainError
                ? error.getAllMessages().join(', ')
                : 'Failed to save add-on';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <BaseModal
            trigger={trigger}
            title={mode === 'create' ? 'New Add-on' : 'Edit Add-on'}
            description="Weekend Package option, priced per person"
            maxWidth="lg"
        >
            {(closeModal) => (
                <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
                    <div>
                        <label className={labelCls}>Type</label>
                        {mode === 'create' ? (
                            <select
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value as AddOnType })}
                                className={inputCls}
                            >
                                <option value="accommodation">Accommodation</option>
                                <option value="transport">Transport</option>
                            </select>
                        ) : (
                            <p className="font-semibold capitalize">{form.type}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>{isRoom ? 'Property' : 'Operator'} <span className="normal-case">(optional)</span></label>
                            <input
                                value={form.provider}
                                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                                placeholder={isRoom ? 'e.g. KOD Apartment' : ''}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Name</label>
                            <input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder={isRoom ? 'e.g. Double room' : 'e.g. Return group transportation'}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Price per person (GH₵)</label>
                            <input
                                type="number"
                                min={0}
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                                className={inputCls}
                            />
                        </div>
                        {isRoom && (
                            <div>
                                <label className={labelCls}>People sharing</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={form.occupancy}
                                    onChange={(e) => setForm({ ...form, occupancy: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Capacity</label>
                            <input
                                type="number"
                                min={1}
                                value={form.capacity}
                                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                                placeholder="Unlimited"
                                className={inputCls}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Max bookings (people)</p>
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
                                <span className="text-sm">{form.isActive ? 'Bookable' : 'Hidden'}</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Description <span className="normal-case">(optional)</span></label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={2}
                            className={inputCls}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button onClick={closeModal} variant="outline" className="flex-1" disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={() => handleSave(closeModal)} className="flex-1" disabled={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Saving...' : mode === 'create' ? 'Create Add-on' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            )}
        </BaseModal>
    );
}
