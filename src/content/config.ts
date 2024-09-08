import { z, defineCollection } from 'astro:content'

const authoritySchema = z.object({
  label: z.string(),
  description: z.string().optional(),
  link: z.string().optional(),
  imageUrl: z.string().optional(),
  gate: z.string().optional(),
})

const nodeSchema = z.object({
  loaded: z.boolean(),
  valid: z.boolean(),
  id: z.string(),
  prettyId: z.string(),
  image: z.string(),
  createdAt: z.date().or(z.null()),
  name: z.string().or(z.null()).optional(),
  description: z.string().optional(),
  authorities: z.array(authoritySchema).optional(),
  error: z.string().optional(),
})

const baseElemSchema = z.object({
  node: nodeSchema,
});

export type Elem = z.infer<typeof baseElemSchema> & {
  children?: Array<Elem>
};

const elemSchema: z.ZodType<Elem> = baseElemSchema.extend({
  children: z.lazy(() => elemSchema.array()).optional(),
});

const hatsCollection = defineCollection({
    type: 'data',
    schema: elemSchema,
})

export const collections = {
  trees: hatsCollection,
}