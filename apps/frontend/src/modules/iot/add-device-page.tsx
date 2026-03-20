'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { iotService } from '@/shared/services/iot-service';
import {
  BoltIcon,
  Chip,
  DeviceIcon,
  FactoryIcon,
  IotActionButton,
  IotEmptyState,
  IotHeroAside,
  IotModulePage,
  IotNotice,
  IotPageHeader,
  IotPanel,
  IotPrimaryButton,
  IotSectionLabel,
  IotSecondaryButton,
  IotSelectField,
  IotStatusPill,
  IotSupportCard,
  IotTextField,
  IotTextareaField,
  PlugIcon
} from '@/modules/iot/iot-chrome';
import { modbusVariableTemplates } from '@/modules/iot/iot-demo-data';

const deviceTypeOptions = [
  { value: 'GATEWAY', label: 'Industrial gateway' },
  { value: 'SENSOR', label: 'Sensor / meter' },
  { value: 'ACTUATOR', label: 'Actuator / PLC' }
];

const transportOptions = [
  { value: 'MODBUS_TCP', label: 'Modbus TCP' },
  { value: 'MODBUS_RTU', label: 'Modbus RTU / RS-485' }
];

const pollingOptions = [
  { value: '2s', label: '2 seconds' },
  { value: '5s', label: '5 seconds' },
  { value: '10s', label: '10 seconds' },
  { value: '30s', label: '30 seconds' }
];

export function IotAddDevicePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [technicalTag, setTechnicalTag] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [deviceType, setDeviceType] = useState('GATEWAY');
  const [transport, setTransport] = useState('MODBUS_TCP');
  const [host, setHost] = useState('192.168.0.10');
  const [port, setPort] = useState('502');
  const [unitId, setUnitId] = useState('1');
  const [pollingProfile, setPollingProfile] = useState('5s');
  const [selectedVariables, setSelectedVariables] = useState<string[]>(['temperature']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplateItems = useMemo(
    () => modbusVariableTemplates.filter((item) => selectedVariables.includes(item.id)),
    [selectedVariables]
  );

  function toggleVariable(variableId: string) {
    setSelectedVariables((current) =>
      current.includes(variableId)
        ? current.filter((item) => item !== variableId)
        : [...current, variableId]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedVariables.length === 0) {
      setError('Select at least one operational variable for the starter device package.');
      return;
    }

    const normalizedHost = host.trim();
    const parsedPort = Number(port);
    const parsedUnitId = Number(unitId);

    if (!name.trim()) {
      setError('Provide a device name before continuing.');
      return;
    }

    if (!normalizedHost) {
      setError('Provide the Modbus communication endpoint for the device.');
      return;
    }

    if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      setError('The Modbus port must be an integer between 1 and 65535.');
      return;
    }

    if (!Number.isInteger(parsedUnitId) || parsedUnitId < 0 || parsedUnitId > 255) {
      setError('The Unit ID / Slave ID must be an integer between 0 and 255.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const identifier =
      technicalTag.trim() || `${normalizedHost.replaceAll('.', '-')}-u${unitId.padStart(2, '0')}`;

    const protocolSummary =
      transport === 'MODBUS_TCP'
        ? `Modbus TCP ${normalizedHost}:${port} | Unit ${unitId}`
        : `Modbus RTU/RS-485 | Gateway ${normalizedHost} | Slave ${unitId}`;

    const variableSummary = selectedTemplateItems.map((item) => item.label).join(', ');
    const deviceDescription = [description.trim(), protocolSummary, `Starter variables: ${variableSummary}`]
      .filter(Boolean)
      .join(' | ');

    try {
      await iotService.createDevice({
        name,
        identifier,
        type: deviceType,
        location: location || undefined,
        description: deviceDescription || undefined,
        status: 'ONLINE',
        transport,
        host: normalizedHost,
        port: parsedPort,
        unitId: parsedUnitId,
        pollingProfile,
        gateway: transport === 'MODBUS_RTU' ? normalizedHost : undefined
      });

      router.push('/iot/devices?created=1');
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'The Modbus device could not be created.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PermissionGuard
      permission="iot.device.create"
      fallback={
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          You do not have permission to register devices in the IoT workspace.
        </div>
      }
    >
      <IotModulePage>
        <IotPageHeader
          eyebrow="Industrial onboarding"
          title="Add Modbus device"
          description="Register a field asset with transport context, a starter telemetry package, and a clear next step into devices, registers, and reports."
          chips={
            <>
              <Chip label="Transport" value={transport === 'MODBUS_TCP' ? 'TCP' : 'RS-485'} tone="cyan" icon={<PlugIcon />} />
              <Chip label="Endpoint" value={`${host}:${port}`} tone="neutral" icon={<BoltIcon />} />
              <Chip label="Starter signals" value={selectedVariables.length} tone="green" icon={<DeviceIcon />} />
            </>
          }
          action={<IotActionButton href="/iot/devices">Open device fleet</IotActionButton>}
          aside={
            <IotHeroAside
              title="Setup path"
              items={[
                { label: 'Step 1', value: 'Asset profile', tone: 'green' },
                { label: 'Step 2', value: 'Connectivity', tone: 'cyan' },
                { label: 'Step 3', value: 'Starter package', tone: 'amber' }
              ]}
            />
          }
        />

        {error ? (
          <IotNotice
            title="Device setup could not be completed"
            description={error}
            tone="red"
          />
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <IotPanel
            title="Device setup"
            description="The flow keeps the existing IoT contract intact while making first registration clearer for demos and onboarding."
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ['1. Asset profile', 'Capture the device name, technical tag, and operational location.'],
                  ['2. Connectivity', 'Choose the Modbus transport, endpoint, Unit ID, and polling pace.'],
                  ['3. Starter package', 'Select a practical first set of signals for demo and validation.']
                ].map(([title, text]) => (
                  <IotSupportCard key={title} className="px-4 py-4">
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-2 text-sm text-muted">{text}</p>
                  </IotSupportCard>
                ))}
              </div>

              <div>
                <IotSectionLabel>Asset profile</IotSectionLabel>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <IotTextField
                  label="Device name"
                  value={name}
                  onChange={setName}
                  placeholder="Main compressor"
                  required
                />
                <IotTextField
                  label="Technical tag"
                  value={technicalTag}
                  onChange={setTechnicalTag}
                  placeholder="CP-01-MODBUS"
                  helper="If left blank, the identifier is derived from the Modbus endpoint."
                />
                <IotTextField
                  label="Location / cell"
                  value={location}
                  onChange={setLocation}
                  placeholder="Compressor room / Line 03"
                />
                <IotSelectField
                  label="Asset category"
                  value={deviceType}
                  onChange={setDeviceType}
                  options={deviceTypeOptions}
                />
              </div>

              <IotTextareaField
                label="Operational notes"
                value={description}
                onChange={setDescription}
                placeholder="Role of the equipment, criticality, and field context."
                helper="The summary stays human-readable while preserving the existing backend contract."
              />

              <IotSupportCard className="p-5">
                <IotSectionLabel>Modbus communication</IotSectionLabel>
                <div className="flex items-center gap-3">
                  <FactoryIcon />
                  <div>
                    <p className="text-lg font-semibold text-foreground">Connectivity layer</p>
                    <p className="text-sm text-muted">
                      Choose the transport and endpoint once, then use registers and telemetry pages to deepen the mapping.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <IotSelectField
                    label="Transport"
                    value={transport}
                    onChange={setTransport}
                    options={transportOptions}
                  />
                  <IotTextField
                    label={transport === 'MODBUS_TCP' ? 'Host / IP' : 'Gateway IP'}
                    value={host}
                    onChange={setHost}
                    placeholder="192.168.0.10"
                    required
                  />
                  <IotTextField
                    label="Port"
                    value={port}
                    onChange={setPort}
                    placeholder="502"
                    required
                  />
                  <IotTextField
                    label="Unit ID / Slave ID"
                    value={unitId}
                    onChange={setUnitId}
                    placeholder="1"
                    required
                  />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <IotSelectField
                    label="Polling profile"
                    value={pollingProfile}
                    onChange={setPollingProfile}
                    options={pollingOptions}
                  />
                  <IotSupportCard className="px-4 py-4">
                    <p className="text-sm font-semibold text-foreground">Connection summary</p>
                    <p className="mt-2 text-sm text-muted">
                      {transport === 'MODBUS_TCP'
                        ? `Reading via ${host}:${port} with Unit ID ${unitId}.`
                        : `Reading through gateway ${host} with RS-485 conversion for slave ${unitId}.`}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <IotStatusPill label={transport === 'MODBUS_TCP' ? 'TCP' : 'RS-485'} tone="cyan" />
                      <IotStatusPill label={`Polling ${pollingProfile}`} tone="green" />
                      <IotStatusPill label={`${selectedVariables.length} starter variable(s)`} tone="neutral" />
                    </div>
                  </IotSupportCard>
                </div>
              </IotSupportCard>

              <div className="flex flex-wrap gap-3">
                <IotPrimaryButton type="submit" disabled={submitting}>
                  {submitting ? 'Saving device...' : 'Save and open fleet'}
                </IotPrimaryButton>
                <IotSecondaryButton onClick={() => router.push('/iot/devices')}>
                  Back to devices
                </IotSecondaryButton>
              </div>
            </form>
          </IotPanel>

          <div className="space-y-6">
            <IotPanel
              title="Starter variables"
              description="Choose the first signals that make the device immediately useful in a demo or local validation run."
            >
              <div className="mb-4">
                <IotSectionLabel>Starter telemetry package</IotSectionLabel>
              </div>
              <div className="space-y-3">
                {modbusVariableTemplates.map((variable) => {
                  const checked = selectedVariables.includes(variable.id);

                  return (
                    <button
                      key={variable.id}
                      type="button"
                      onClick={() => toggleVariable(variable.id)}
                      className={[
                        'w-full rounded-lg border px-4 py-4 text-left transition',
                        checked
                          ? 'border-accent bg-accent-muted'
                          : 'border-border bg-surface-inset hover:border-accent'
                      ].join(' ')}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={[
                            'mt-0.5 inline-flex h-5 w-5 rounded-xl border',
                            checked
                              ? 'border-accent bg-accent-muted'
                              : 'border-border bg-surface'
                          ].join(' ')}
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-foreground">{variable.label}</p>
                            <IotStatusPill label={`${variable.functionCode} | ${variable.dataType}`} tone="neutral" />
                          </div>
                          <p className="mt-1 text-sm text-muted">{variable.description}</p>
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                            Register {variable.registerAddress} | Unit {variable.unit}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </IotPanel>

            <IotPanel
              title="Selected package"
              description="Preview the context that will be ready for the next mapping pass in registers and telemetry."
            >
              {selectedTemplateItems.length === 0 ? (
                <IotEmptyState
                  title="No variables selected"
                  description="Choose at least one signal so the device lands with a useful starter package."
                  tone="amber"
                />
              ) : (
                <div className="space-y-3">
                  {selectedTemplateItems.map((item) => (
                    <IotSupportCard
                      key={item.id}
                      className="px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{item.label}</p>
                          <p className="text-sm text-muted">{item.description}</p>
                        </div>
                        <div className="text-right text-xs uppercase tracking-[0.16em] text-muted">
                          <p>{item.registerAddress}</p>
                          <p>{item.unit}</p>
                        </div>
                      </div>
                    </IotSupportCard>
                  ))}
                </div>
              )}
            </IotPanel>

            <IotPanel
              title="After save"
              description="Keep the next operator action obvious so the onboarding flow does not stall after the first device is created."
            >
              <div className="space-y-3">
                <IotSupportCard className="px-4 py-4">
                  <p className="text-sm font-semibold text-foreground">Validate connectivity</p>
                  <p className="mt-2 text-sm text-muted">
                    Confirm the new asset appears in the device fleet with the expected endpoint and transport.
                  </p>
                </IotSupportCard>
                <IotSupportCard className="px-4 py-4">
                  <p className="text-sm font-semibold text-foreground">Refine registers</p>
                  <p className="mt-2 text-sm text-muted">
                    Use the registers page to expand the starter package into a fuller Modbus mapping.
                  </p>
                </IotSupportCard>
                <IotSupportCard className="px-4 py-4">
                  <p className="text-sm font-semibold text-foreground">Check demo readiness</p>
                  <p className="mt-2 text-sm text-muted">
                    Open reports and dashboard pages to confirm the workspace now reads as a live industrial surface.
                  </p>
                </IotSupportCard>
              </div>
            </IotPanel>
          </div>
        </div>
      </IotModulePage>
    </PermissionGuard>
  );
}
