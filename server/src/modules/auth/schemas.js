const { z } = require('../../middleware/validate');

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number').optional(),
  password: z.string().min(8).max(128),
}).refine((d) => d.email || d.phone, {
  message: 'Either email or phone number is required.',
  path: ['email'],
});

const loginSchema = z.object({
  identifier: z.string().min(3, 'Enter your email or phone number'),
  password: z.string().min(8).max(128),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

module.exports = { registerSchema, loginSchema, refreshSchema };