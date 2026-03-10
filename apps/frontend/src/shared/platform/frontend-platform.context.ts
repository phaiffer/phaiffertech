import { createContext } from 'react';
import type { FrontendPlatformState } from '@/shared/platform/frontend-platform.types';

export const FrontendPlatformContext = createContext<FrontendPlatformState | null>(null);
