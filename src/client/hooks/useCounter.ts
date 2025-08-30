import { useCallback, useEffect, useState } from 'react';
import type { InitResponse, IncrementResponse, DecrementResponse } from '../../shared/types/api';

interface CounterState {
  count: number;
  username: string | null;
  loading: boolean;
}

export const useCounter = () => {
  const [state, setState] = useState<CounterState>({
    count: 0,
    username: null,
    loading: true,
  });
  const [postId, setPostId] = useState<string | null>(null);

  // NO API CALLS - use mock data for now, Reddit API integration coming
  useEffect(() => {
    console.log('🔄 Initializing Reddit Stonks with mock data');
    setState({ 
      count: 42, 
      username: 'reddit-trader', 
      loading: false 
    });
    setPostId('reddit-stonks-dev');
  }, []);

  const update = useCallback(
    async (action: 'increment' | 'decrement') => {
      // No API calls needed - this is mock data for now
      setState((prev) => ({ 
        ...prev, 
        count: action === 'increment' ? prev.count + 1 : prev.count - 1 
      }));
    },
    []
  );

  const increment = useCallback(() => update('increment'), [update]);
  const decrement = useCallback(() => update('decrement'), [update]);

  return {
    ...state,
    increment,
    decrement,
  } as const;
};
