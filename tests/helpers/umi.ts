import fs from "fs"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata"
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox"
import { mplCore } from "@metaplex-foundation/mpl-core"

import { Keypair, Signer, createSignerFromKeypair, keypairIdentity, signerIdentity } from "@metaplex-foundation/umi"

const kpfile = "/Users/joefitter/.config/solana/id.json"
const kp = new Uint8Array(JSON.parse(fs.readFileSync(kpfile).toString()))

export const umi = createUmi("http://localhost:8899", { commitment: "processed" })
  .use(mplTokenMetadata())
  .use(mplToolbox())
  .use(mplCore())

export const adminSigner = createSignerFromKeypair(umi, umi.eddsa.createKeypairFromSecretKey(kp))

umi.use(signerIdentity(adminSigner))

export function getUmi(kp: Keypair) {
  return createUmi("http://localhost:8899", { commitment: "processed" })
    .use(mplTokenMetadata())
    .use(mplToolbox())
    .use(keypairIdentity(kp))
    .use(mplCore())
}
