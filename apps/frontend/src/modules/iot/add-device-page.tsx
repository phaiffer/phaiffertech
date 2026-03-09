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
  IotEmptyState,
  IotHeroAside,
  IotNotice,
  IotPageHeader,
  IotPanel,
  IotPrimaryButton,
  IotSectionLabel,
  IotSecondaryButton,
  IotSelectField,
  IotStatusPill,
  IotTextField,
  IotTextareaField,
  PlugIcon
} from '@/modules/iot/iot-chrome';
import { modbusVariableTemplates } from '@/modules/iot/iot-demo-data';

const deviceTypeOptions = [
  { value: 'GATEWAY', label: 'Gateway industrial' },
  { value: 'SENSOR', label: 'Sensor / medidor' },
  { value: 'ACTUATOR', label: 'Atuador / CLP' }
];

const transportOptions = [
  { value: 'MODBUS_TCP', label: 'Modbus TCP' },
  { value: 'MODBUS_RTU', label: 'Modbus RTU / RS-485' }
];

const pollingOptions = [
  { value: '2s', label: '2 segundos' },
  { value: '5s', label: '5 segundos' },
  { value: '10s', label: '10 segundos' },
  { value: '30s', label: '30 segundos' }
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
      setError('Selecione ao menos uma variável operacional para o dispositivo.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const identifier =
      technicalTag.trim() || `${host.replaceAll('.', '-')}-u${unitId.padStart(2, '0')}`;

    const protocolSummary =
      transport === 'MODBUS_TCP'
        ? `Modbus TCP ${host}:${port} • Unit ${unitId}`
        : `Modbus RTU/RS-485 • Gateway ${host} • Slave ${unitId}`;

    const variableSummary = selectedTemplateItems.map((item) => item.label).join(', ');
    const deviceDescription = [description.trim(), protocolSummary, `Variáveis: ${variableSummary}`]
      .filter(Boolean)
      .join(' | ');

    try {
      await iotService.createDevice({
        name,
        identifier,
        type: deviceType,
        location: location || undefined,
        description: deviceDescription || undefined,
        status: 'ONLINE'
      });

      router.push('/iot/devices?created=1');
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Não foi possível criar o dispositivo Modbus.'
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
          Você não possui permissão para cadastrar dispositivos no IoT System.
        </div>
      }
    >
      <div className="space-y-6">
        <IotPageHeader
          eyebrow="Onboarding industrial"
          title="Cadastrar dispositivo Modbus"
          description="Cadastre um ativo industrial com contexto Modbus TCP ou RS-485, pacote inicial de medições e resumo confiável para continuidade em registradores e telemetria."
          chips={
            <>
              <Chip label="Protocolo" value={transport === 'MODBUS_TCP' ? 'TCP' : 'RS-485'} tone="cyan" icon={<PlugIcon />} />
              <Chip label="Endpoint" value={port} tone="neutral" icon={<BoltIcon />} />
              <Chip label="Variáveis" value={selectedVariables.length} tone="green" icon={<DeviceIcon />} />
            </>
          }
          aside={
            <IotHeroAside
              title="Roteiro do cadastro"
              items={[
                { label: 'Etapa 1', value: 'Identificar o ativo', tone: 'green' },
                { label: 'Etapa 2', value: 'Definir a comunicação Modbus', tone: 'cyan' },
                { label: 'Etapa 3', value: 'Selecionar o pacote inicial', tone: 'amber' }
              ]}
            />
          }
        />

        {error ? (
          <IotNotice
            title="Não foi possível concluir o cadastro"
            description={error}
            tone="red"
          />
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <IotPanel
            title="Configuração do ativo"
            description="O formulário mantém o contrato atual do módulo e organiza o onboarding em uma sequência curta e confiável."
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ['1. Ativo', 'Nome, tag técnica, localização e papel do equipamento.'],
                  ['2. Comunicação', 'Protocolo, endpoint, Unit ID e cadência de coleta.'],
                  ['3. Pacote inicial', 'Seleção do conjunto mínimo de variáveis para demo.']
                ].map(([title, text]) => (
                  <div
                    key={title}
                    className="rounded-[24px] border border-slate-800 bg-slate-950/35 px-4 py-4"
                  >
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-2 text-sm text-slate-400">{text}</p>
                  </div>
                ))}
              </div>

              <div>
                <IotSectionLabel>Identificação do ativo</IotSectionLabel>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <IotTextField
                  label="Nome do dispositivo"
                  value={name}
                  onChange={setName}
                  placeholder="Ex: Compressor Principal"
                  required
                />
                <IotTextField
                  label="Identificador técnico / tag"
                  value={technicalTag}
                  onChange={setTechnicalTag}
                  placeholder="Ex: CP-01-MODBUS"
                  helper="Se vazio, o identificador será derivado do endpoint Modbus."
                />
                <IotTextField
                  label="Localização / célula"
                  value={location}
                  onChange={setLocation}
                  placeholder="Casa de compressores / Linha 03"
                />
                <IotSelectField
                  label="Categoria do ativo"
                  value={deviceType}
                  onChange={setDeviceType}
                  options={deviceTypeOptions}
                />
              </div>

              <IotTextareaField
                label="Descrição operacional"
                value={description}
                onChange={setDescription}
                placeholder="Função do equipamento, criticidade e observações de campo."
                helper="Esta descrição será enriquecida com o contexto de comunicação Modbus no payload persistido."
              />

              <div className="rounded-[28px] border border-slate-800 bg-slate-950/35 p-5">
                <IotSectionLabel>Comunicação Modbus</IotSectionLabel>
                <div className="flex items-center gap-3">
                  <FactoryIcon />
                  <div>
                    <p className="text-lg font-semibold text-white">Camada de comunicação</p>
                    <p className="text-sm text-slate-400">
                      Semântica industrial compatível com Modbus TCP e RS-485, sem alterar o contrato já consolidado.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <IotSelectField
                    label="Protocolo"
                    value={transport}
                    onChange={setTransport}
                    options={transportOptions}
                  />
                  <IotTextField
                    label={transport === 'MODBUS_TCP' ? 'Host / IP' : 'IP do gateway / concentrador'}
                    value={host}
                    onChange={setHost}
                    placeholder="192.168.0.10"
                    required
                  />
                  <IotTextField
                    label="Porta"
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
                    label="Polling"
                    value={pollingProfile}
                    onChange={setPollingProfile}
                    options={pollingOptions}
                  />
                  <div className="rounded-2xl border border-cyan-500/15 bg-[#071223] px-4 py-4">
                    <p className="text-sm font-semibold text-white">Resumo da conexão</p>
                    <p className="mt-2 text-sm text-slate-400">
                      {transport === 'MODBUS_TCP'
                        ? `Leitura via ${host}:${port} com Unit ID ${unitId}.`
                        : `Leitura via gateway ${host} convertendo RS-485 para Modbus com Slave ${unitId}.`}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <IotStatusPill label={transport === 'MODBUS_TCP' ? 'TCP' : 'RS-485'} tone="cyan" />
                      <IotStatusPill label={`Polling ${pollingProfile}`} tone="green" />
                      <IotStatusPill label={`${selectedVariables.length} variáveis`} tone="neutral" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <IotPrimaryButton type="submit" disabled={submitting}>
                  {submitting ? 'Salvando cadastro...' : 'Salvar e abrir a frota'}
                </IotPrimaryButton>
                <IotSecondaryButton onClick={() => router.push('/iot/devices')}>
                  Voltar para dispositivos
                </IotSecondaryButton>
              </div>
            </form>
          </IotPanel>

          <div className="space-y-6">
            <IotPanel
              title="Variáveis do dispositivo"
              description="Selecione o pacote inicial de medições para a narrativa de demo e para o próximo ciclo de detalhamento dos registradores."
            >
              <div className="mb-4">
                <IotSectionLabel>Pacote inicial de coleta</IotSectionLabel>
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
                        'w-full rounded-[24px] border px-4 py-4 text-left transition',
                        checked
                          ? 'border-cyan-400/45 bg-cyan-400/12'
                          : 'border-slate-800 bg-slate-950/35 hover:border-slate-600'
                      ].join(' ')}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={[
                            'mt-0.5 inline-flex h-5 w-5 rounded-xl border',
                            checked
                              ? 'border-cyan-300 bg-cyan-400/25'
                              : 'border-slate-700 bg-slate-950/30'
                          ].join(' ')}
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-white">{variable.label}</p>
                            <IotStatusPill label={`${variable.functionCode} • ${variable.dataType}`} tone="neutral" />
                          </div>
                          <p className="mt-1 text-sm text-slate-400">{variable.description}</p>
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Registrador {variable.registerAddress} • Unidade {variable.unit}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </IotPanel>

            <IotPanel
              title="Pacote selecionado"
              description="Pré-visualização do contexto que ficará preparado para a continuidade do mapeamento e do stream operacional."
            >
              {selectedTemplateItems.length === 0 ? (
                <IotEmptyState
                  title="Nenhuma variável selecionada"
                  description="Escolha pelo menos uma medição para deixar o cadastro pronto para a sequência de registradores e telemetria."
                  tone="amber"
                />
              ) : (
                <div className="space-y-3">
                  {selectedTemplateItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950/35 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{item.label}</p>
                          <p className="text-sm text-slate-400">{item.description}</p>
                        </div>
                        <div className="text-right text-xs uppercase tracking-[0.16em] text-slate-500">
                          <p>{item.registerAddress}</p>
                          <p>{item.unit}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </IotPanel>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
