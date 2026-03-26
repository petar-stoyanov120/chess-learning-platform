import { z } from 'zod';

export const variationSchema = z.object({
  name: z.string().min(1, 'Variation name is required.').max(200, 'Variation name is too long.'),
  notation: z.string().min(1, 'Variation notation is required.').max(10000, 'Notation is too long.'),
  sortOrder: z.number().int().nonnegative().optional(),
});
