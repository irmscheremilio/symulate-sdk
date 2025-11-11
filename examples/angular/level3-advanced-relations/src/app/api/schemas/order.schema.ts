import { m, type Infer } from '@symulate/sdk';

export const OrderSchema = m.object({
  id: m.uuid(),
  userId: m.uuid(), // FK to User
  orderNumber: m.string(),
  status: m.string(), // 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
  total: m.number(),
  subtotal: m.number(),
  tax: m.number(),
  shipping: m.number(),
  shippingAddress: m.object({
    street: m.location.street(),
    city: m.location.city(),
    state: m.location.state(),
    zipCode: m.location.zipCode(),
    country: m.location.country(),
  }),
  createdAt: m.date(),
  updatedAt: m.date(),
});

export type Order = Infer<typeof OrderSchema>;
