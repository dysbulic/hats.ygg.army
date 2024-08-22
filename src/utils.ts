export const ipfs2HTTP = (ipfs: string) => {
  return ipfs.replace('ipfs://', 'https://ipfs.io/ipfs/');
}

export type Maybe<T> = T | null
