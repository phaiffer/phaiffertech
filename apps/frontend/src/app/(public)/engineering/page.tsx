import type { Metadata } from 'next';
import { WebsiteEngineeringPage } from '@/modules/website/website-engineering-page';

export const metadata: Metadata = {
  title: 'Engineering',
  description:
    'See how PhaifferTech frames data engineering, cloud architecture and platform engineering in the public brand.'
};

export default function EngineeringPage() {
  return <WebsiteEngineeringPage />;
}
