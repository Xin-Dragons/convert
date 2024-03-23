import * as anchor from "@coral-xyz/anchor"
import { programPaidBy } from "../helper"
import { PublicKey, unwrapOptionRecursively } from "@metaplex-foundation/umi"
import {
  DigitalAsset,
  MPL_TOKEN_METADATA_PROGRAM_ID,
  findMasterEditionPda,
} from "@metaplex-foundation/mpl-token-metadata"
import { fromWeb3JsPublicKey, toWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters"
import { findMetadataPda, fetchDigitalAsset } from "@metaplex-foundation/mpl-token-metadata"
import { generateSigner, Signer, KeypairSigner } from "@metaplex-foundation/umi"

import {
  FEES_WALLET,
  findConverterPda,
  findMetadataDelegateRecord,
  findProgramConfigPda,
  findProgramDataAddress,
  getTokenAccount,
  getTokenRecordPda,
} from "./pdas"
import { umi } from "./umi"
import { SPL_TOKEN_PROGRAM_ID, getSysvar } from "@metaplex-foundation/mpl-toolbox"
import { createCollection } from "./create-collection"
import { MPL_TOKEN_AUTH_RULES_PROGRAM_ID } from "@metaplex-foundation/mpl-token-auth-rules"
import { Convert } from "../../target/types/convert"

export async function init({
  user,
  title,
  slug,
  logo,
  bg,
  nftMint,
  destinationCollection,
  ruleSet = null,
}: {
  user: KeypairSigner
  title: string
  slug: string
  logo: string
  bg: string
  nftMint: PublicKey
  destinationCollection?: DigitalAsset
  ruleSet?: PublicKey | null
}) {
  const program = programPaidBy(user as KeypairSigner)
  const da = await fetchDigitalAsset(umi, nftMint)
  const collection = unwrapOptionRecursively(da.metadata.collection)
  const isCollection = collection && collection.verified
  const collectionIdentifier =
    (isCollection && collection.key) || unwrapOptionRecursively(da.metadata.creators).find((c) => c.verified).address
  const converter = findConverterPda(collectionIdentifier)

  destinationCollection = destinationCollection || (await createCollection(undefined, user))

  const collectionDelegateRecord = findMetadataDelegateRecord(
    destinationCollection.publicKey,
    destinationCollection.metadata.updateAuthority,
    converter
  )

  return await program.methods
    .init(title, slug, logo, bg)
    .accounts({
      programConfig: findProgramConfigPda(),
      converter,
      collectionIdentifier,
      nftMint,
      nftMetadata: findMetadataPda(umi, { mint: nftMint })[0],
      destinationCollectionMint: destinationCollection.publicKey,
      destinationCollectionMetadata: destinationCollection.metadata.publicKey,
      collectionDelegateRecord,
      ruleSet,
      authority: destinationCollection.metadata.updateAuthority,
      tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
      sysvarInstructions: getSysvar("instructions"),
      authorizationRulesProgram: MPL_TOKEN_AUTH_RULES_PROGRAM_ID,
      authorizationRules: unwrapOptionRecursively(destinationCollection.metadata.programmableConfig).ruleSet || null,
    })
    .rpc()
}

export async function initUnapproved({
  user,
  title,
  slug,
  logo,
  bg,
  nftMint,
  destinationCollection,
  ruleSet = null,
}: {
  user: KeypairSigner
  title: string
  slug: string
  logo: string
  bg: string
  nftMint: PublicKey
  destinationCollection?: DigitalAsset
  ruleSet?: PublicKey | null
}) {
  const program = programPaidBy(user as KeypairSigner)
  const da = await fetchDigitalAsset(umi, nftMint)
  const collection = unwrapOptionRecursively(da.metadata.collection)
  const isCollection = collection && collection.verified
  const collectionIdentifier =
    (isCollection && collection.key) || unwrapOptionRecursively(da.metadata.creators).find((c) => c.verified).address
  const converter = findConverterPda(collectionIdentifier)

  destinationCollection = destinationCollection || (await createCollection(undefined, user))

  const collectionDelegateRecord = findMetadataDelegateRecord(
    destinationCollection.publicKey,
    destinationCollection.metadata.updateAuthority,
    converter
  )

  return await program.methods
    .initUnapproved(title, slug, logo, bg)
    .accounts({
      programConfig: findProgramConfigPda(),
      converter,
      collectionIdentifier,
      nftMint,
      nftMetadata: findMetadataPda(umi, { mint: nftMint })[0],
      destinationCollectionMint: destinationCollection.publicKey,
      destinationCollectionMetadata: destinationCollection.metadata.publicKey,
      collectionDelegateRecord,
      ruleSet,
      authority: destinationCollection.metadata.updateAuthority,
      tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
      sysvarInstructions: getSysvar("instructions"),
      authorizationRulesProgram: MPL_TOKEN_AUTH_RULES_PROGRAM_ID,
      authorizationRules: unwrapOptionRecursively(destinationCollection.metadata.programmableConfig).ruleSet || null,
    })
    .rpc()
}

export async function convert(user: KeypairSigner, converter: PublicKey, nft: DigitalAsset) {
  const newMint = generateSigner(umi)
  const program = programPaidBy(user)
  const converterAccount = await program.account.converter.fetch(converter)
  const collectionIdentifier = fromWeb3JsPublicKey(converterAccount.sourceCollection)

  const collection = unwrapOptionRecursively(nft.metadata.collection)
  const isCollection = collection && collection.verified

  const destinationCollection = fromWeb3JsPublicKey(converterAccount.destinationCollection)

  const destinationCollectionDa = await fetchDigitalAsset(umi, destinationCollection)
  const collectionDelegateRecord = findMetadataDelegateRecord(
    destinationCollection,
    destinationCollectionDa.metadata.updateAuthority,
    converter
  )

  await program.methods
    .convert()
    .accounts({
      converter,
      programConfig: findProgramConfigPda(),
      feesWallet: FEES_WALLET,
      nftMint: nft.publicKey,
      nftSource: getTokenAccount(nft.publicKey, user.publicKey),
      nftMetadata: nft.metadata.publicKey,
      masterEdition: nft.edition.publicKey,
      collectionMetadata: isCollection ? findMetadataPda(umi, { mint: collectionIdentifier })[0] : null,
      newMint: newMint.publicKey,
      newToken: getTokenAccount(newMint.publicKey, user.publicKey),
      tokenRecord: getTokenRecordPda(newMint.publicKey, user.publicKey),
      newMetadata: findMetadataPda(umi, { mint: newMint.publicKey })[0],
      newMasterEdition: findMasterEditionPda(umi, { mint: newMint.publicKey })[0],
      newCollectionMint: destinationCollection,
      newCollectionMetadata: findMetadataPda(umi, { mint: destinationCollection })[0],
      collectionDelegateRecord,
      newCollectionMasterEdition: findMasterEditionPda(umi, { mint: destinationCollection })[0],
      metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
      sysvarInstructions: getSysvar("instructions"),
    })
    .preInstructions([anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })])
    .signers([toWeb3JsKeypair(newMint)])
    .rpc()

  return newMint.publicKey
}
