import type { Metadata } from 'next';
import { WebsiteProductsPage } from '@/modules/website/website-products-page';

export const metadata: Metadata = {
  title: 'Products',
  description:
    'Review the current PhaifferTech product portfolio across CRM, PetFlow and IoT System.'
};

export default function ProductsPage() {
  return <WebsiteProductsPage />;
}
