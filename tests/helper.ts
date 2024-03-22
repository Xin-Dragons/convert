import * as anchor from "@coral-xyz/anchor"
import { KeypairSigner, generateSigner, sol } from "@metaplex-foundation/umi"
import { umi } from "./helpers/umi"
import { toWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters"
import { Convert } from "../target/types/convert"
import { findProgramConfigPda, findProgramDataAddress } from "./helpers/pdas"

anchor.setProvider(anchor.AnchorProvider.env())
export const adminProgram = anchor.workspace.Convert as anchor.Program<Convert>

export const CONVERT_FEE = sol(0.015).basisPoints
export const MINTING_FEE = sol(0.01).basisPoints

before(async () => {
  await adminProgram.methods
    .initProgramConfig(new anchor.BN(CONVERT_FEE.toString()))
    .accounts({
      programConfig: findProgramConfigPda(),
      program: adminProgram.programId,
      programData: findProgramDataAddress(),
    })
    .rpc()
})

export function programPaidBy(payer: KeypairSigner): anchor.Program<Convert> {
  const newProvider = new anchor.AnchorProvider(
    adminProgram.provider.connection,
    new anchor.Wallet(toWeb3JsKeypair(payer)),
    {}
  )

  return new anchor.Program(adminProgram.idl, adminProgram.programId, newProvider)
}

export async function createNewUser() {
  const kp = generateSigner(umi)

  await umi.rpc.airdrop(kp.publicKey, sol(100))
  return kp
}
