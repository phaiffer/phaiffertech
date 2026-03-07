import { ModuleGuard } from '@/shared/modules/module-guard';
import { ReactNode } from 'react';

export default function IotLayout({ children }: { children: ReactNode }) {
  return <ModuleGuard moduleCode="IOT">{children}</ModuleGuard>;
}
