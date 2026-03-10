'use client';

import { useContext } from 'react';
import { FrontendPlatformContext } from '@/shared/platform/frontend-platform.context';

export function useFrontendPlatform() {
  const context = useContext(FrontendPlatformContext);

  if (!context) {
    throw new Error('useFrontendPlatform must be used within FrontendPlatformProvider.');
  }

  return context;
}
