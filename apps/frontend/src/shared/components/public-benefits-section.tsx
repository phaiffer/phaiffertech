'use client';

import Image from 'next/image';
import { Clock, Shield, Heart } from 'lucide-react';
import { publicSiteContainerClass } from '@/shared/components/public-visual-system';

const benefits = [
  {
    icon: Clock,
    title: 'Economia de tempo',
    description: 'Reduza em ate 70% o tempo gasto com tarefas administrativas e burocraticas.',
  },
  {
    icon: Shield,
    title: 'Seguranca de dados',
    description: 'Armazenamento seguro na nuvem com backup automatico e protecao LGPD completa.',
  },
  {
    icon: Heart,
    title: 'Experiencia do cliente',
    description: 'Lembretes automaticos, historico acessivel e atendimento mais agil e profissional.',
  },
];

export function PublicBenefitsSection() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className={publicSiteContainerClass}>
        {/* Section Header */}
        <div className="mb-16 text-center">
          <span className="inline-flex items-center rounded-full border border-petflow/20 bg-petflow/5 px-4 py-1.5 text-sm font-medium text-petflow">
            Tecnologia veterinaria
          </span>
          <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
            Mais tempo para cuidar dos pets
          </h2>
        </div>

        {/* Content Grid */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Image Column */}
          <div className="relative">
            <div className="overflow-hidden rounded-2xl shadow-xl">
              <Image
                src="/images/dog-raincoat.jpg"
                alt="Cachorro com capa de chuva amarela"
                width={600}
                height={500}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>

          {/* Benefits Column */}
          <div className="space-y-2">
            <p className="text-lg leading-relaxed text-slate-700">
              Automatize processos administrativos e foque no que realmente importa: o bem-estar dos animais.
            </p>

            <div className="space-y-6 pt-6">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-petflow/10">
                      <IconComponent className="h-6 w-6 text-petflow" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {benefit.title}
                      </h3>
                      <p className="mt-1 text-base text-slate-700">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
