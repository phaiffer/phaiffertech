import { ModuleGuard } from '@/shared/modules/module-guard';
import { ReactNode } from 'react';

export default function CrmLayout({ children }: { children: ReactNode }) {
  return <ModuleGuard moduleCode="CRM">{children}</ModuleGuard>;
}
