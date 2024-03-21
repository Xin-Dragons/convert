import {
  MetadataDelegateRole,
  findMetadataDelegateRecordPda,
  findTokenRecordPda,
} from "@metaplex-foundation/mpl-token-metadata"
import { PublicKey, Umi, publicKey } from "@metaplex-foundation/umi"
import idl from "~/idl/convert.json"
import { findAssociatedTokenPda } from "@metaplex-foundation/mpl-toolbox"
import { string, publicKey as publicKeySerializer } from "@metaplex-foundation/umi/serializers"

const programId = publicKey(idl.metadata.address)

export function findProgramConfigPda(umi: Umi) {
  return umi.eddsa.findPda(programId, [string({ size: "variable" }).serialize("program-config")])[0]
}

export function findProgramDataAddress(umi: Umi) {
  return umi.eddsa.findPda(publicKey("BPFLoaderUpgradeab1e11111111111111111111111"), [
    publicKeySerializer().serialize(programId),
  ])[0]
}

export function findConverterPda(umi: Umi, collection: PublicKey) {
  return umi.eddsa.findPda(programId, [
    string({ size: "variable" }).serialize("CONVERT"),
    publicKeySerializer().serialize(collection),
  ])[0]
}

export function findMetadataDelegateRecord(
  umi: Umi,
  collectionMint: PublicKey,
  updateAuthority: PublicKey,
  converter: PublicKey
) {
  return findMetadataDelegateRecordPda(umi, {
    mint: collectionMint,
    delegateRole: MetadataDelegateRole.Collection,
    updateAuthority,
    delegate: converter,
  })[0]
}

export function getTokenRecordPda(umi: Umi, mint: PublicKey, owner: PublicKey) {
  return findTokenRecordPda(umi, {
    mint,
    token: getTokenAccount(umi, mint, owner),
  })[0]
}

export function getTokenAccount(umi: Umi, mint: PublicKey, owner: PublicKey) {
  return findAssociatedTokenPda(umi, { mint, owner })[0]
}
