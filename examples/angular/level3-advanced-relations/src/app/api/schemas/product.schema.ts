import { m, type Infer } from '@symulate/sdk';

export const ProductSchema = m.object({
  id: m.uuid(),
  name: m.commerce.productName(),
  description: m.lorem.paragraph(),
  price: m.commerce.price(),
  category: m.commerce.department(),
  imageUrl: m.optional(m.url()),
  stock: m.number(),
  rating: m.number(),
  sku: m.string(),
  inStock: m.boolean(),
  tags: m.optional(m.array(m.lorem.word())),
});

export type Product = Infer<typeof ProductSchema>;
