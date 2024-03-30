import * as anchor from "@coral-xyz/anchor"
import { programPaidBy } from "../helper"
import { PublicKey, unwrapOptionRecursively } from "@metaplex-foundation/umi"
import {
  DigitalAsset,
  MPL_TOKEN_METADATA_PROGRAM_ID,
  TokenStandard,
  findMasterEditionPda,
} from "@metaplex-foundation/mpl-token-metadata"
import { fromWeb3JsPublicKey, toWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters"
import { findMetadataPda, fetchDigitalAsset } from "@metaplex-foundation/mpl-token-metadata"
import { generateSigner, KeypairSigner } from "@metaplex-foundation/umi"

import {
  FEES_WALLET,
  findConverterPda,
  findMetadataDelegateRecord,
  findProgramConfigPda,
  findProgramDataAddress,
  getTokenAccount,
  getTokenRecordPda,
} from "./pdas"
import { isEqual } from "lodash"
import { umi } from "./umi"
import { getSysvar } from "@metaplex-foundation/mpl-toolbox"
import { createCollection, createCoreCollection } from "./create-collection"
import { MPL_TOKEN_AUTH_RULES_PROGRAM_ID } from "@metaplex-foundation/mpl-token-auth-rules"
import { MPL_CORE_PROGRAM_ID, fetchCollectionV1, isRuleSet } from "@metaplex-foundation/mpl-core"
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
    (destinationCollection as DigitalAsset).metadata.updateAuthority,
    converter
  )

  const destinationCollectionMetadata = (destinationCollection as DigitalAsset).metadata.publicKey

  const authority = destinationCollection.metadata.updateAuthority

  const authorizationRules =
    unwrapOptionRecursively((destinationCollection as DigitalAsset).metadata.programmableConfig).ruleSet || null

  return await program.methods
    .init(title, slug, logo, bg)
    .accounts({
      programConfig: findProgramConfigPda(),
      converter,
      collectionIdentifier,
      nftMint,
      nftMetadata: findMetadataPda(umi, { mint: nftMint })[0],
      destinationCollectionMint: destinationCollection.publicKey,
      destinationCollectionMetadata,
      collectionDelegateRecord,
      ruleSet,
      authority,
      tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
      sysvarInstructions: getSysvar("instructions"),
      authorizationRulesProgram: MPL_TOKEN_AUTH_RULES_PROGRAM_ID,
      authorizationRules,
    })
    .rpc()
}

export async function initCore({
  user,
  title,
  slug,
  uri = "",
  logo,
  bg,
  nftMint,
}: {
  user: KeypairSigner
  title: string
  slug: string
  uri?: string
  logo: string
  bg: string
  nftMint: PublicKey
}) {
  const program = programPaidBy(user as KeypairSigner)
  const da = await fetchDigitalAsset(umi, nftMint)
  const collection = unwrapOptionRecursively(da.metadata.collection)
  const isCollection = collection && collection.verified
  const collectionIdentifier =
    (isCollection && collection.key) || unwrapOptionRecursively(da.metadata.creators).find((c) => c.verified).address
  const converter = findConverterPda(collectionIdentifier)

  const destinationCollection = generateSigner(umi)

  return await program.methods
    .initCore(title, slug, uri, logo, bg)
    .accounts({
      programConfig: findProgramConfigPda(),
      converter,
      collectionIdentifier,
      nftMint,
      nftMetadata: findMetadataPda(umi, { mint: nftMint })[0],
      destinationCollection: destinationCollection.publicKey,
      authority: user.publicKey,
      coreProgram: MPL_CORE_PROGRAM_ID,
    })
    .signers([toWeb3JsKeypair(destinationCollection)])
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

  const isPnft = isEqual(converterAccount.assetType, { pnft: {} })

  const destinationCollectionDa = isPnft
    ? await fetchDigitalAsset(umi, destinationCollection)
    : await fetchCollectionV1(umi, destinationCollection)

  const collectionDelegateRecord = isPnft
    ? findMetadataDelegateRecord(
        destinationCollection,
        (destinationCollectionDa as DigitalAsset).metadata.updateAuthority,
        converter
      )
    : null

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
      newToken: isPnft ? getTokenAccount(newMint.publicKey, user.publicKey) : null,
      tokenRecord: isPnft ? getTokenRecordPda(newMint.publicKey, user.publicKey) : null,
      newMetadata: isPnft ? findMetadataPda(umi, { mint: newMint.publicKey })[0] : null,
      newMasterEdition: isPnft ? findMasterEditionPda(umi, { mint: newMint.publicKey })[0] : null,
      newCollectionMint: destinationCollection,
      newCollectionMetadata: isPnft ? findMetadataPda(umi, { mint: destinationCollection })[0] : null,
      collectionDelegateRecord,
      newCollectionMasterEdition: isPnft ? findMasterEditionPda(umi, { mint: destinationCollection })[0] : null,
      metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
      sysvarInstructions: getSysvar("instructions"),
    })
    .preInstructions([anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })])
    .signers([toWeb3JsKeypair(newMint)])
    .rpc()

  return newMint.publicKey
}

export async function convertCore(user: KeypairSigner, converter: PublicKey, nft: DigitalAsset) {
  const newMint = generateSigner(umi)
  const program = programPaidBy(user)
  const converterAccount = await program.account.converter.fetch(converter)
  const collectionIdentifier = fromWeb3JsPublicKey(converterAccount.sourceCollection)

  const collection = unwrapOptionRecursively(nft.metadata.collection)
  const isCollection = collection && collection.verified

  const isPnft = unwrapOptionRecursively(nft.metadata.tokenStandard) === TokenStandard.ProgrammableNonFungible
  const tokenRecord = isPnft ? getTokenRecordPda(nft.publicKey, user.publicKey) : null

  const destinationCollection = fromWeb3JsPublicKey(converterAccount.destinationCollection)

  await program.methods
    .convertCore()
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
      updateAuthority: converterAccount.authority,
      newCollectionMint: destinationCollection,
      metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
      tokenRecord,
      sysvarInstructions: getSysvar("instructions"),
      coreProgram: MPL_CORE_PROGRAM_ID,
    })
    .preInstructions([anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })])
    .signers([toWeb3JsKeypair(newMint)])
    .rpc()

  return newMint.publicKey
}

export async function closeCoreConverter(user: KeypairSigner, converter: PublicKey) {
  const program = programPaidBy(user)
  const converterAcc = await program.account.converter.fetch(converter)

  await program.methods
    .closeCoreConverter()
    .accounts({
      programConfig: findProgramConfigPda(),
      program: null,
      programData: null,
      converter,
      collection: converterAcc.destinationCollection,
      coreProgram: MPL_CORE_PROGRAM_ID,
    })
    .rpc()
}

export async function closeConverter({
  user,
  converter,
  program,
}: {
  user?: KeypairSigner
  converter: PublicKey
  program?: anchor.Program<Convert>
}) {
  program = program || programPaidBy(user)
  const converterAcc = await program.account.converter.fetch(converter)
  const collectionMint = fromWeb3JsPublicKey(converterAcc.destinationCollection)
  const collection = await fetchDigitalAsset(umi, collectionMint)
  const collectionDelegateRecord = findMetadataDelegateRecord(
    collectionMint,
    collection.metadata.updateAuthority,
    converter
  )
  const authorizationRules = unwrapOptionRecursively(collection.metadata.programmableConfig).ruleSet || null
  const isUa = converterAcc.authority.equals(program.provider.publicKey)

  await program.methods
    .closeConverter()
    .accounts({
      programConfig: findProgramConfigPda(),
      program: isUa ? null : program.programId,
      programData: isUa ? null : findProgramDataAddress(),
      converter,
      collectionMint,
      collectionMetadata: findMetadataPda(umi, { mint: collectionMint })[0],
      collectionDelegateRecord,
      authorizationRules,
      authorizationRulesProgram: authorizationRules ? MPL_TOKEN_AUTH_RULES_PROGRAM_ID : null,
      tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
      sysvarInstructions: getSysvar("instructions"),
    })
    .rpc()
}
