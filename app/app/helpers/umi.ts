import { createUmi } from "@metaplex-foundation/umi"
import { web3JsEddsa } from "@metaplex-foundation/umi-eddsa-web3js"

export const umi = createUmi().use(web3JsEddsa())
