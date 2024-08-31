import { HatsSubgraphClient } from '@hatsprotocol/sdk-v1-subgraph'
import { HatsDetailsClient } from '@hatsprotocol/details-sdk'
import { ipfs2HTTP, type Maybe } from '../utils'

interface GetTreeProps {
  chainId: number
  count?: number
  load?: boolean
}

type Start = {
  loaded: boolean
  valid: boolean
}

type Return = {
  id: string
  prettyId?: string
  imageUri?: string
  createdAt?: Maybe<string>
  details?: string
}

export type Hat = {
  id: string
  prettyId?: string
  treeId?: number
  name?: string
  description?: string
  image?: string
  createdAt: Date
  loaded: boolean
  valid: true
}

export type BadHat = {
  id?: string
  prettyId?: string
  treeId?: number
  name?: string
  description?: string
  image?: string
  createdAt?: Date | string
  error: string
  loaded: boolean
  valid: false
}

export type Tree<T> = {
  node: T,
  children: Array<Tree<T>>
}

const hatProps = {
  prettyId: true,
  details: true,
  imageUri: true,
  createdAt: true,
}

const clients = {
  graph: new HatsSubgraphClient({}),
  details: new HatsDetailsClient({
    provider: 'pinata',
    pinata: {
      pinningKey: (
        process?.env?.PUBLIC_PINNING_KEY
        ?? import.meta?.env?.PUBLIC_PINNING_KEY
     )
   },
  }),
}

export const completeHat = async (ret: Return) => {
  let base = { loaded: false, valid: false } as Start
  try {
    const { id, prettyId, details, imageUri: imageURI, createdAt } = ret

    if(!id) throw new Error('No ID for entry.')

    console.debug(`Completing Hat: ${id}.`)

    base = {
      loaded: true,
      valid: true,
      id,
      prettyId,
      image: imageURI && ipfs2HTTP(imageURI),
      createdAt: createdAt ? new Date(createdAt) : null,
    } as Hat

    console.debug(`Using Details: ${details}.`)

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
        name: details || null,
      } as Hat
    }
  } catch(err) {
    return {
      ...base,
      valid: false,
      error: (err as Error).message
    } as BadHat
  }
}

export const getTopHats = (
  async (
    { chainId, count = 100, load = true }: GetTreeProps
  ): Promise<Array<Hat | BadHat>> => {
    let done = false
    let page = 0
    let out: Array<Hat | BadHat> = []
    let index = 1
    do {
      const trees = await clients.graph.getTreesPaginated({
        chainId,
        props: {
          hats: {
            props: hatProps,
            filters: { first: 1 }, // fetch only the top-hat
          },
        },
        page: page++,
        perPage: count,
      })

      console.debug(
        `Got ${trees.length} tree${trees.length === 1 ? '' : 's'}`
        + ` for chain ${chainId}.`
      )

      done = trees.length < count

      out.push(...(await Promise.all(
        trees.map(async ({ hats: [top] = [] }) => {
          const hat = load ? (
            await completeHat(top)
          ) : (
            {
              ...top,
              loaded: false,
              valid: true,
              createdAt: top.createdAt ? new Date(top.createdAt) : null,
            } as Hat
          )
          hat.treeId = index++
          return hat
        })
      )))
    } while(!done)

    return out
  }
)

export const getHats = (
  async (
    { chainId, treeId }:
    { chainId: number, treeId: number }
  ): Promise<Maybe<Array<Hat | BadHat>>> => {
    const res = await clients.graph.getTree({
      chainId,
      treeId,
      props: { hats: { props: hatProps } },
    })
    return (
      res.hats ? (
        Promise.all(res.hats.map(completeHat))
      ) : (
        null
      )
    )
  }
)
export const getTree = (
  async (
    { chainId, treeId }:
    { chainId: number, treeId: number }
  ): Promise<Maybe<Tree<Hat | BadHat>>> => {
    const hats = await getHats({ chainId, treeId })

    if(!hats) return null

    const base = {} as Tree<Hat | BadHat>
    hats.forEach((hat) => {
      const ids = (
        hat.prettyId
        ?.replace(/^0x/, '')
        .split('.')
        .map((x) => Number(`0x${x}`))
      )
      console.debug({ ids })
      if(ids) {
        const rootId = ids.shift()
        let currId = ids.shift()
        let current = base
        while(currId != null) {
          console.debug({ currId })
          current.children ??= []
          current = current.children[currId - 1] ??= (
            {} as Tree<Hat | BadHat>
          )
          currId = ids.shift()
        }
        current.node = hat
      }
    })
    return base
  }
)