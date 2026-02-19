'use client';

import { useCallback, useState } from 'react';
import { RefreshTokenResponse } from '@/lib/types/x-oauth';

interface UseXOAuthOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Hook for X OAuth operations
 */
export function useXOAuth(options?: UseXOAuthOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initiate X OAuth flow
   */
  const initiateOAuth = useCallback(
    async (athleteId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // Validate athleteId format
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(athleteId)) {
          throw new Error('Invalid athlete ID format');
        }

        // Redirect to authorization endpoint
        window.location.href = `/api/auth/x/authorize?athleteId=${athleteId}`;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'OAuth initialization failed';
        setError(message);
        options?.onError?.(message);
        setIsLoading(false);
      }
    },
    [options],
  );

  /**
   * Refresh X access token
   */
  const refreshToken = useCallback(
    async (athleteId: string): Promise<RefreshTokenResponse | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/auth/x/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ athleteId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(
            data.error || 'Failed to refresh token',
          );
        }

        const data: RefreshTokenResponse = await response.json();
        options?.onSuccess?.();
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Token refresh failed';
        setError(message);
        options?.onError?.(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [options],
  );

  /**
   * Check OAuth connection status and handle callback
   */
  const handleCallbackParams = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected') === 'true';
    const error = params.get('error');

    if (connected) {
      options?.onSuccess?.();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (error) {
      setError(decodeURIComponent(error));
      options?.onError?.(decodeURIComponent(error));
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return { connected, error };
  }, [options]);

  return {
    isLoading,
    error,
    initiateOAuth,
    refreshToken,
    handleCallbackParams,
  };
}
