export const ipfs2HTTP = (ipfs: string) => (
  ipfs && ipfs.replace(/^ipfs:\/\//, 'https://ipfs.io/ipfs/') || null
)

export const isoDate = (date = new Date()) => (
  date.toLocaleDateString('sv').replace(/-/g, '⁄')
)

export type Maybe<T> = T | null

