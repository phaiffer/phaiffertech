'use client';

import { useEffect, useState } from 'react';
import { moduleService } from '@/shared/services/module-service';
import { ModuleItem } from '@/shared/types/module';

export function useModuleCatalog() {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    moduleService
      .list()
      .then((result) => {
        if (!active) {
          return;
        }
        setModules(result);
        setError(null);
      })
      .catch((err: Error) => {
        if (!active) {
          return;
        }
        setModules([]);
        setError(err.message);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return { modules, loading, error };
}

export function findModule(modules: ModuleItem[], moduleCode: string) {
  return modules.find((moduleItem) => moduleItem.code === moduleCode);
}
