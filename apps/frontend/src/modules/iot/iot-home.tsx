'use client';

import { FormEvent, useEffect, useState } from 'react';
import { iotService } from '@/shared/services/iot-service';
import { IotDevice } from '@/shared/types/iot';
import { PageTitle } from '@/shared/ui/page-title';
import { Table } from '@/shared/ui/table';

export function IotHome() {
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  async function load() {
    try {
      const page = await iotService.listDevices();
      setDevices(page.content);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await iotService.createDevice({ name, serialNumber });
      setName('');
      setSerialNumber('');
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <PageTitle title="IoT" description="Recurso inicial: dispositivos e monitoramento base." />

      <form onSubmit={handleCreate} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Nome do dispositivo"
          required
        />
        <input
          value={serialNumber}
          onChange={(event) => setSerialNumber(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Serial"
          required
        />
        <button type="submit" className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white">
          Novo device
        </button>
      </form>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <Table headers={['Nome', 'Serial', 'Status']}>
        {devices.map((device) => (
          <tr key={device.id}>
            <td className="px-4 py-2">{device.name}</td>
            <td className="px-4 py-2">{device.serialNumber}</td>
            <td className="px-4 py-2">{device.status}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
