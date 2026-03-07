import { ModuleGuard } from '@/shared/modules/module-guard';
import { ReactNode } from 'react';

export default function PetLayout({ children }: { children: ReactNode }) {
  return <ModuleGuard moduleCode="PET">{children}</ModuleGuard>;
}
