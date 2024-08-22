import { z, defineCollection } from 'astro:content'

const hatsCollection = defineCollection({
    type: 'content',
    schema: z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      image: z.string(),
    })
})

export const collections = {
  hats: hatsCollection,
}