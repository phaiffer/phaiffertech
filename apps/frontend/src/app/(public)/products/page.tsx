import type { Metadata } from 'next';
import { WebsiteProductsPage } from '@/modules/website/website-products-page';

export const metadata: Metadata = {
  title: 'Products',
  description:
    'Review Pet Management as the current visible PhaifferTech product for grooming, pet shops, and recurring pet operations.'
};

export default function ProductsPage() {
  return <WebsiteProductsPage />;
}
