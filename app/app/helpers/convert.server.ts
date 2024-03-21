import * as anchor from "@coral-xyz/anchor"
import { Signer } from "@metaplex-foundation/umi"
import { Convert, IDL } from "~/types/convert"
import { metadata } from "~/idl/convert.json"

const programId = new anchor.web3.PublicKey(metadata.address)

const connection = new anchor.web3.Connection(process.env.RPC_HOST!, { commitment: "processed" })
export function getProgram(signer: Signer) {
  const provider = new anchor.AnchorProvider(connection, signer as any, {})

  return new anchor.Program<Convert>(IDL, programId, provider)
}

export const convertProgram = new anchor.Program<Convert>(IDL, programId, {
  connection,
})
