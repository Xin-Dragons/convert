import {
  MetadataDelegateRole,
  findMetadataDelegateRecordPda,
  findTokenRecordPda,
} from "@metaplex-foundation/mpl-token-metadata"
import { PublicKey, publicKey } from "@metaplex-foundation/umi"
import { umi } from "./umi"
import idl from "../../target/idl/convert.json"
import { findAssociatedTokenPda } from "@metaplex-foundation/mpl-toolbox"
import { string, publicKey as publicKeySerializer } from "@metaplex-foundation/umi/serializers"

const programId = publicKey(idl.metadata.address)

export function findProgramConfigPda() {
  return umi.eddsa.findPda(programId, [string({ size: "variable" }).serialize("program-config")])[0]
}

export function findProgramDataAddress() {
  return umi.eddsa.findPda(publicKey("BPFLoaderUpgradeab1e11111111111111111111111"), [
    publicKeySerializer().serialize(programId),
  ])[0]
}

export function findConverterPda(collection: PublicKey) {
  return umi.eddsa.findPda(programId, [
    string({ size: "variable" }).serialize("CONVERT"),
    publicKeySerializer().serialize(collection),
  ])[0]
}

export function findMetadataDelegateRecord(
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

export function getTokenRecordPda(mint: PublicKey, owner: PublicKey) {
  return findTokenRecordPda(umi, {
    mint,
    token: getTokenAccount(mint, owner),
  })[0]
}

export function getTokenAccount(mint: PublicKey, owner: PublicKey) {
  return findAssociatedTokenPda(umi, { mint, owner })[0]
}

export const FEES_WALLET = publicKey("4dm8ndfR78PcQudJrS7TXM7R4qM3GAHpY87UtHnxovpa")
