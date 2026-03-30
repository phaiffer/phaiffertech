'use client';

import { use } from 'react';
import { PetTimelinePage } from '@/modules/pet/pet-timeline-page';

type TimelinePageProps = {
  params: Promise<{ id: string }>;
};

export default function PetTimelineRoutePage({ params }: TimelinePageProps) {
  const { id } = use(params);

  return <PetTimelinePage petId={id} showSubnav />;
}
