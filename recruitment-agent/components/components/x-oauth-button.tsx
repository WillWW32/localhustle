'use client';

import React, { useEffect, useState } from 'react';
import { useXOAuth } from '@/lib/hooks/use-x-oauth';

interface XOAuthButtonProps {
  athleteId: string;
  onConnected?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

/**
 * X OAuth Connect Button Component
 *
 * Usage:
 * <XOAuthButton
 *   athleteId={athlete.id}
 *   onConnected={() => console.log('Connected!')}
 *   onError={(error) => console.error(error)}
 * />
 */
export function XOAuthButton({
  athleteId,
  onConnected,
  onError,
  className,
}: XOAuthButtonProps) {
  const [isConnected, setIsConnected] = useState(false);
  const { isLoading, error, initiateOAuth, handleCallbackParams } = useXOAuth({
    onSuccess: () => {
      setIsConnected(true);
      onConnected?.();
    },
    onError,
  });

  useEffect(() => {
    // Check for callback parameters on component mount
    const result = handleCallbackParams();
    if (result?.connected) {
      setIsConnected(true);
    }
  }, [handleCallbackParams]);

  const handleClick = async () => {
    await initiateOAuth(athleteId);
  };

  if (isConnected) {
    return (
      <button
        type="button"
        disabled
        className={`${className || ''} bg-green-100 text-green-800 px-4 py-2 rounded font-medium cursor-default`}
      >
        ✓ X Connected
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`${className || ''} bg-black text-white px-4 py-2 rounded font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
      >
        {isLoading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.514l-5.106-6.677L2.306 21.75H0l7.644-8.746L0 2.25h6.678l4.744 6.278 5.822-6.278zM17.7 19.5h1.828L6.374 4.07H4.447L17.7 19.5z" />
            </svg>
            Connect X Account
          </>
        )}
      </button>

      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}

/**
 * X OAuth Status Component
 *
 * Displays the X connection status for an athlete
 */
interface XOAuthStatusProps {
  isConnected: boolean;
  xHandle?: string;
  xProfileUrl?: string;
  onDisconnect?: () => Promise<void>;
}

export function XOAuthStatus({
  isConnected,
  xHandle,
  xProfileUrl,
  onDisconnect,
}: XOAuthStatusProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your X account?')) {
      return;
    }

    try {
      setIsDisconnecting(true);
      await onDisconnect?.();
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <span className="w-2 h-2 bg-gray-400 rounded-full" />
        Not connected
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full" />
        <div>
          <p className="text-sm font-medium">
            {xHandle ? (
              <a
                href={xProfileUrl || `https://twitter.com/${xHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                @{xHandle}
              </a>
            ) : (
              'Connected'
            )}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDisconnect}
        disabled={isDisconnecting}
        className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
      </button>
    </div>
  );
}
