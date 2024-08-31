#!/usr/bin/env npx tsx

import path from 'node:path'
import { chains } from '../src/content/chains'
import { getTree } from '../src/content/trees'
import { getTopHats } from '../src/content/trees'
import fs from 'node:fs'

const __dirname = new URL('.', import.meta.url).pathname
const outdir = path.join(__dirname, '..', 'trees')

await fs.promises.mkdir(outdir, { recursive: true })

for(const [id, name] of Object.entries(chains)) {
  const chainId = Number(id)
  console.debug(`Processing Chain: ${name}`)
  for(const root of await getTopHats({ chainId, load: false })) {
    console.debug(`Loading ${name}:${root.id}`)
    if(root.treeId == null) {
      console.error(`No id for ${name}:${root.id}.`)
    } else {
      const tree = await getTree({ chainId, treeId: root.treeId })
      if(!tree) {
        console.error(`Failed to load ${name}:${root.id}.`)
      } else {
        const id = `0x${root.treeId.toString(16).padStart(3, '0')}`
        const filename = `tree.chain:${chainId}.id:${id}.json`
        console.debug(`Saving to ${filename}.`)
        await fs.promises.writeFile(
          path.join(outdir, filename),
          JSON.stringify(tree, null, 2)
        )
      }
    }
  }
}