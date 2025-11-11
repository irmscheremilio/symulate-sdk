import { m, type Infer } from '@symulate/sdk';

export const OrderItemSchema = m.object({
  id: m.uuid(),
  orderId: m.uuid(), // FK to Order
  productId: m.uuid(), // FK to Product
  quantity: m.number(),
  unitPrice: m.number(),
  totalPrice: m.number(),
});

export type OrderItem = Infer<typeof OrderItemSchema>;
