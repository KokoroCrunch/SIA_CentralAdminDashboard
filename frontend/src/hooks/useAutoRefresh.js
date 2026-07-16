/**
 * useAutoRefresh
 *
 * Calls `fetchFn` immediately on mount, then on a fixed interval.
 * Cleans up the interval automatically on unmount.
 *
 * Usage:
 *   useAutoRefresh(loadData, 30_000);   // refresh every 30 s
 *   useAutoRefresh(loadData);           // defaults to 30 s
 *
 * @param {() => void} fetchFn   - async or sync function that loads data
 * @param {number}     [ms=30000] - polling interval in milliseconds
 */
import { useEffect } from 'react';

export default function useAutoRefresh(fetchFn, ms = 30_000) {
  useEffect(() => {
    // Fire immediately
    fetchFn();

    // Then repeat on the interval
    const id = setInterval(fetchFn, ms);

    // Clean up when the component unmounts or deps change
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — fetchFn is expected to be stable (defined outside or wrapped in useCallback)
}
