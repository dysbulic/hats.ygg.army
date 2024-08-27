import { HatsSubgraphClient } from '@hatsprotocol/sdk-v1-subgraph'
import { HatsDetailsClient } from '@hatsprotocol/details-sdk'
import { ipfs2HTTP, type Maybe } from '../utils'

interface GetTreeProps {
  chainId: number
  count?: number
  page?: number
}

type Start = {
  loaded: boolean
  valid: boolean
}

export type Hat = {
  id: string
  name: string
  description?: string
  image?: string
  createdAt: Date | string
  loaded: true
  valid: true
}

export type BadHat = {
  id?: string
  name?: string
  description?: string
  image?: string
  createdAt?: Date | string
  error: string
  loaded: boolean
  valid: false
}

export type Tree<T> = {
  root: T,
  children: Array<T>
}

const clients = {
  graph: new HatsSubgraphClient({}),
  details: new HatsDetailsClient({
    provider: 'pinata',
    pinata: { pinningKey: import.meta.env.PUBLIC_PINNING_KEY },
  }),
}

export const getTrees = (
  async (
    { chainId, count = 100, page = 0 }: GetTreeProps
  ): Promise<Array<Hat | BadHat>> => {
    const trees = await clients.graph.getTreesPaginated({
      chainId,
      props: {
        hats: {
          props: {
            prettyId: true,
            details: true,
            imageUri: true,
            createdAt: true,
          },
          filters: { first: 1 }, // fetch only the top-hat
        },
      },
      page,
      perPage: count,
    })

    return await Promise.all(
      trees.map(async ({ hats: [top] = [] }) => {
        let base = { loaded: false, valid: false } as Start
        try {
          const { prettyId: id, details, imageUri: imageURI, createdAt } = top

          if(!id) throw new Error('No ID for entry.')

          base = {
            loaded: true,
            valid: true,
            id,
            image: imageURI && ipfs2HTTP(imageURI),
            createdAt: createdAt ?? '¿?',
          } as Hat
          if(details?.startsWith('ipfs://')) {
            const { parsedData } = (
              await clients.details.get(details.replace(/^ipfs:\/\//, ''))
            )

            if(!parsedData) throw new Error('No data.')

            return {
              ...base,
              ...parsedData.data,
            } as Hat
          } else {
            return {
              ...base,
              name: details || '¿?',
            } as Hat
          }
        } catch(err) {
          return {
            ...base,
            valid: false,
            error: (err as Error).message
          } as BadHat
        }
      })
    )
  }
)

export const getTree = (
  async (
    { chainId, id }:
    { chainId: number, id: number }
  ): Promise<Maybe<Tree<Hat>>> => {
    const res = await clients.graph.getTree({
      chainId,
      treeId: id,
      props: {
        hats: {
          props: {
            prettyId: true,
            details: true,
            imageUri: true,
            createdAt: true,
          },
        },
      },
    })
    console.debug({ res })
    return null
  }
)