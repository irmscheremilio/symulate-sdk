import { m, type Infer } from '@symulate/sdk';

// ============================================
// USER SCHEMA
// ============================================
// Separate schema file for better organization

export const UserSchema = m.object({
  id: m.uuid(),
  username: m.internet.userName(),
  email: m.email(),
  firstName: m.person.firstName(),
  lastName: m.person.lastName(),
  avatar: m.optional(m.internet.avatar()),
  bio: m.optional(m.lorem.paragraph()),
  joinedAt: m.date(),
  // Role with enum-like values
  role: m.string(),
  isActive: m.boolean(),
});

export type User = Infer<typeof UserSchema>;
