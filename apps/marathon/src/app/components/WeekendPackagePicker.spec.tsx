import { fireEvent, render, screen } from '@testing-library/react';
import type { BaseAddOn } from '@ak-marathon/sdk';
import { WeekendPackagePicker } from './WeekendPackagePicker';
import { RACE_ONLY } from '../lib/weekendPackage';

const addOn = (overrides: Partial<BaseAddOn>): BaseAddOn => ({
  id: 'id',
  type: 'accommodation',
  name: 'Room',
  provider: null,
  description: null,
  occupancy: null,
  price: 0,
  capacity: null,
  booked: 0,
  remaining: null,
  isActive: true,
  createdAt: '2026-09-25T00:00:00.000Z',
  ...overrides,
});

const kodDouble = addOn({ id: 'kod-2', provider: 'KOD Apartment', name: 'Double room', occupancy: 2, price: 22500 });
const kodSingle = addOn({ id: 'kod-1', provider: 'KOD Apartment', name: 'Single room', occupancy: 1, price: 45000 });
const bus = addOn({ id: 'bus', type: 'transport', name: 'Return group transportation', price: 25000 });

describe('WeekendPackagePicker', () => {
  it('shows the four bundles', () => {
    render(<WeekendPackagePicker addOns={[kodDouble, kodSingle, bus]} value={RACE_ONLY} onChange={jest.fn()} />);

    for (const label of ['Race only', 'Race + Transport', 'Race + Stay', 'Full Package']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('reports the bundle the participant picks', () => {
    const onChange = jest.fn();
    render(<WeekendPackagePicker addOns={[kodDouble, bus]} value={RACE_ONLY} onChange={onChange} />);

    fireEvent.click(screen.getByText('Full Package'));

    expect(onChange).toHaveBeenCalledWith({ ...RACE_ONLY, bundle: 'full' });
  });

  it('lists rooms with per-person prices for a stay bundle and reports the choice', () => {
    const onChange = jest.fn();
    const value = { ...RACE_ONLY, bundle: 'race_stay' as const };
    render(<WeekendPackagePicker addOns={[kodDouble, kodSingle, bus]} value={value} onChange={onChange} />);

    expect(screen.getByText('KOD Apartment — Double room (2 sharing)')).toBeTruthy();
    expect(screen.getByText('₵225')).toBeTruthy();

    fireEvent.click(screen.getByText('KOD Apartment — Single room (1 sharing)'));
    expect(onChange).toHaveBeenCalledWith({ ...value, accommodationId: 'kod-1' });
  });

  it('marks a sold-out room and does not let it be picked', () => {
    const onChange = jest.fn();
    const soldOut = { ...kodSingle, capacity: 1, booked: 1, remaining: 0 };
    render(
      <WeekendPackagePicker
        addOns={[kodDouble, soldOut]}
        value={{ ...RACE_ONLY, bundle: 'race_stay' }}
        onChange={onChange}
      />,
    );

    expect(screen.getByText('Fully booked')).toBeTruthy();
    fireEvent.click(screen.getByText('KOD Apartment — Single room (1 sharing)'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('offers only race-only when nothing is on sale', () => {
    render(<WeekendPackagePicker addOns={[]} value={RACE_ONLY} onChange={jest.fn()} />);

    expect(screen.getByText('Race only')).toBeTruthy();
    expect(screen.queryByText('Full Package')).toBeNull();
  });
});
