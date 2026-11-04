import { PetInventoryPage } from '@/modules/pet/pet-inventory-page';

// Comanda v2: /inventory opens the same stock screen as /pet/inventory (the old hub only linked there).
export default function InventoryRoute() {
  return <PetInventoryPage />;
}
