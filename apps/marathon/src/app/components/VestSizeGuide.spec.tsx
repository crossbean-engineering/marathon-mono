import { fireEvent, render, screen } from '@testing-library/react';
import { VestSizeGuideLink, VestSizeTable } from './VestSizeGuide';
import { SHIRT_SIZES } from '../types/packages';

describe('VestSizeTable', () => {
  it('lists every vest size offered at registration', () => {
    render(<VestSizeTable />);

    for (const size of SHIRT_SIZES) {
      expect(screen.getByText(size)).toBeTruthy();
    }
  });

  it('shows TBC until the supplier measurements are filled in', () => {
    render(<VestSizeTable />);

    expect(screen.getAllByText('TBC').length).toBeGreaterThan(0);
  });
});

describe('VestSizeGuideLink', () => {
  it('opens the size guide', () => {
    render(<VestSizeGuideLink />);
    expect(screen.queryByText('Race Vest Size Guide')).toBeNull();

    fireEvent.click(screen.getByText('Size guide'));

    expect(screen.getByText('Race Vest Size Guide')).toBeTruthy();
  });
});
