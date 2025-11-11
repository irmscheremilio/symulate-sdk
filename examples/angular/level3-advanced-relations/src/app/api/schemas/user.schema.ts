import { m, type Infer } from '@symulate/sdk';

export const UserSchema = m.object({
  id: m.uuid(),
  name: m.person.fullName(),
  email: m.email(),
  avatar: m.optional(m.internet.avatar()),
  address: m.object({
    street: m.location.street(),
    city: m.location.city(),
    state: m.location.state(),
    zipCode: m.location.zipCode(),
    country: m.location.country(),
  }),
  phone: m.phoneNumber(),
  memberSince: m.date(),
  loyaltyPoints: m.number(),
  isActive: m.boolean(),
});

export type User = Infer<typeof UserSchema>;
