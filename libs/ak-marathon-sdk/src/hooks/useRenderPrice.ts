import { useCallback } from 'react';

/**
 * Returns a function that converts pesewas to Ghana Cedis and formats with currency symbol.
 * e.g. 45000 pesewas → "₵450"
 */
export const useRenderPrice = () => {
  const renderPrice = useCallback((pesewas: number) => {
    const cedis = pesewas / 100;
    return `₵${cedis.toLocaleString()}`;
  }, []);

  return { renderPrice };
};
