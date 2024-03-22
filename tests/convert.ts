import * as anchor from "@coral-xyz/anchor"
import { createCollection } from "./helpers/create-collection"
import { umi } from "./helpers/umi"
import {
  DigitalAsset,
  MPL_TOKEN_METADATA_PROGRAM_ID,
  fetchDigitalAsset,
  fetchMetadataDelegateRecord,
  findMasterEditionPda,
  findMetadataPda,
} from "@metaplex-foundation/mpl-token-metadata"
import {
  FEES_WALLET,
  findConverterPda,
  findMetadataDelegateRecord,
  findProgramConfigPda,
  getTokenAccount,
  getTokenRecordPda,
} from "./helpers/pdas"
import { CONVERT_FEE, MINTING_FEE, adminProgram, createNewUser, programPaidBy } from "./helper"
import { createNft } from "./helpers/create-nft"
import { getSysvar } from "@metaplex-foundation/mpl-toolbox"
import { MPL_TOKEN_AUTH_RULES_PROGRAM_ID } from "@metaplex-foundation/mpl-token-auth-rules"
import { KeypairSigner, PublicKey, generateSigner, sol, unwrapOptionRecursively } from "@metaplex-foundation/umi"
import { assert } from "chai"
import { toWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters"
import { isEqual } from "lodash"
import { assertErrorCode, expectFail } from "./helpers/utils"
import { Convert } from "../target/types/convert"

describe("converter", () => {
  let sourceCollection: DigitalAsset
  let destinationCollection: DigitalAsset
  let user: KeypairSigner
  let userProgram: anchor.Program<Convert>
  let nft: DigitalAsset
  let converter: PublicKey
  let collectionDelegateRecord: PublicKey

  before(async () => {
    user = await createNewUser()
    userProgram = programPaidBy(user)
    sourceCollection = await createCollection(umi)
    destinationCollection = await createCollection(umi)
    nft = await createNft({
      umi,
      isPnft: false,
      collection: sourceCollection.publicKey,
      owner: user.publicKey,
      name: "Test NFT",
      symbol: "TEST",
      sellerFeeBasisPoints: 5,
      uri: "https://example.com",
      creators: [
        {
          address: umi.identity.publicKey,
          share: 0,
          verified: true,
        },
        {
          address: generateSigner(umi).publicKey,
          share: 100,
          verified: false,
        },
      ],
    })
    converter = findConverterPda(sourceCollection.publicKey)
    collectionDelegateRecord = findMetadataDelegateRecord(
      destinationCollection.publicKey,
      umi.identity.publicKey,
      converter
    )
  })

  it("Cannot create a converter if not UA", async () => {
    await expectFail(
      () =>
        userProgram.methods
          .init("Test project", "test_project", "12345", "12345")
          .accounts({
            programConfig: findProgramConfigPda(),
            converter,
            sourceCollectionMint: sourceCollection.publicKey,
            sourceCollectionMetadata: sourceCollection.metadata.publicKey,
            destinationCollectionMint: destinationCollection.publicKey,
            destinationCollectionMetadata: destinationCollection.metadata.publicKey,
            collectionDelegateRecord,
            ruleSet: null,
            tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
            sysvarInstructions: getSysvar("instructions"),
            authorizationRulesProgram: MPL_TOKEN_AUTH_RULES_PROGRAM_ID,
            authorizationRules: unwrapOptionRecursively(destinationCollection.metadata.programmableConfig).ruleSet,
          })
          .rpc(),
      (err) => assertErrorCode(err, "UnauthorisedUA")
    )
  })

  it("Cannot create a converter with an invalid ruleset", async () => {
    const invalidRuleSet = await createCollection(umi)
    await expectFail(
      () =>
        adminProgram.methods
          .init("Test project", "test_project", "12345", "12345")
          .accounts({
            programConfig: findProgramConfigPda(),
            converter,
            sourceCollectionMint: sourceCollection.publicKey,
            sourceCollectionMetadata: sourceCollection.metadata.publicKey,
            destinationCollectionMint: destinationCollection.publicKey,
            destinationCollectionMetadata: destinationCollection.metadata.publicKey,
            collectionDelegateRecord,
            ruleSet: invalidRuleSet.publicKey,
            tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
            sysvarInstructions: getSysvar("instructions"),
            authorizationRulesProgram: MPL_TOKEN_AUTH_RULES_PROGRAM_ID,
            authorizationRules: unwrapOptionRecursively(destinationCollection.metadata.programmableConfig).ruleSet,
          })
          .rpc(),
      (err) => assertErrorCode(err, "InvalidRuleSet")
    )
  })

  it("Can create a new converter", async () => {
    await adminProgram.methods
      .init("Test project", "test_project", "12345", "12345")
      .accounts({
        programConfig: findProgramConfigPda(),
        converter,
        sourceCollectionMint: sourceCollection.publicKey,
        sourceCollectionMetadata: sourceCollection.metadata.publicKey,
        destinationCollectionMint: destinationCollection.publicKey,
        destinationCollectionMetadata: destinationCollection.metadata.publicKey,
        collectionDelegateRecord,
        ruleSet: null,
        tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        sysvarInstructions: getSysvar("instructions"),
        authorizationRulesProgram: MPL_TOKEN_AUTH_RULES_PROGRAM_ID,
        authorizationRules: unwrapOptionRecursively(destinationCollection.metadata.programmableConfig).ruleSet,
      })
      .rpc()

    const delegate = await fetchMetadataDelegateRecord(umi, collectionDelegateRecord)
    assert.equal(delegate.delegate, converter, "Expected converter to be the delegate")
  })

  it("cannot convert an NFT from a different collection", async () => {
    const newMint = generateSigner(umi)
    const invalidCollection = await createCollection(umi)
    const invalidNft = await createNft({
      umi,
      isPnft: false,
      collection: invalidCollection.publicKey,
      uri: "",
      name: "",
      symbol: "",
      creators: null,
      sellerFeeBasisPoints: 0,
      owner: user.publicKey,
    })
    await expectFail(
      () =>
        userProgram.methods
          .convert()
          .accounts({
            converter,
            programConfig: findProgramConfigPda(),
            feesWallet: FEES_WALLET,
            nftMint: invalidNft.publicKey,
            nftMetadata: invalidNft.metadata.publicKey,
            updateAuthority: invalidNft.metadata.updateAuthority,
            masterEdition: invalidNft.edition.publicKey,
            collectionMetadata: sourceCollection.metadata.publicKey,
            nftSource: getTokenAccount(invalidNft.publicKey, user.publicKey),
            newMint: newMint.publicKey,
            authority: user.publicKey,
            newToken: getTokenAccount(newMint.publicKey, user.publicKey),
            tokenRecord: getTokenRecordPda(newMint.publicKey, user.publicKey),
            newMetadata: findMetadataPda(umi, { mint: newMint.publicKey })[0],
            newMasterEdition: findMasterEditionPda(umi, { mint: newMint.publicKey })[0],
            newCollectionMint: destinationCollection.publicKey,
            newCollectionMetadata: destinationCollection.metadata.publicKey,
            collectionDelegateRecord,
            newCollectionMasterEdition: destinationCollection.edition.publicKey,
            metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
            sysvarInstructions: getSysvar("instructions"),
          })
          .preInstructions([anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })])
          .signers([toWeb3JsKeypair(newMint)])
          .rpc(),
      (err) => assertErrorCode(err, "InvalidCollection")
    )
  })

  it("Can convert an NFT to a pNFT", async () => {
    const newMint = generateSigner(umi)

    const userBalBefore = await umi.rpc.getBalance(user.publicKey)
    await userProgram.methods
      .convert()
      .accounts({
        converter,
        programConfig: findProgramConfigPda(),
        feesWallet: FEES_WALLET,
        nftMint: nft.publicKey,
        nftMetadata: nft.metadata.publicKey,
        updateAuthority: nft.metadata.updateAuthority,
        masterEdition: nft.edition.publicKey,
        collectionMetadata: sourceCollection.metadata.publicKey,
        nftSource: getTokenAccount(nft.publicKey, user.publicKey),
        newMint: newMint.publicKey,
        authority: user.publicKey,
        newToken: getTokenAccount(newMint.publicKey, user.publicKey),
        tokenRecord: getTokenRecordPda(newMint.publicKey, user.publicKey),
        newMetadata: findMetadataPda(umi, { mint: newMint.publicKey })[0],
        newMasterEdition: findMasterEditionPda(umi, { mint: newMint.publicKey })[0],
        newCollectionMint: destinationCollection.publicKey,
        newCollectionMetadata: destinationCollection.metadata.publicKey,
        collectionDelegateRecord,
        newCollectionMasterEdition: destinationCollection.edition.publicKey,
        metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        sysvarInstructions: getSysvar("instructions"),
      })
      .preInstructions([anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })])
      .signers([toWeb3JsKeypair(newMint)])
      .rpc()

    const userBalAfter = await umi.rpc.getBalance(user.publicKey)

    const pnft = await fetchDigitalAsset(umi, newMint.publicKey)

    assert.equal(pnft.metadata.name, nft.metadata.name, "Expected name to be cloned")
    assert.equal(pnft.metadata.symbol, nft.metadata.symbol, "Expected symbol to be cloned")
    assert.equal(pnft.metadata.uri, nft.metadata.uri, "Expected uri to be cloned")
    assert.equal(
      pnft.metadata.sellerFeeBasisPoints,
      nft.metadata.sellerFeeBasisPoints,
      "Expected sellerFeeBasisPoints to be cloned"
    )

    const unwrappedCollection = unwrapOptionRecursively(pnft.metadata.collection)
    assert.equal(
      unwrappedCollection.key,
      destinationCollection.publicKey,
      "Expected pNFT to be added to new collection"
    )
    assert.ok(unwrappedCollection.verified, "Expected to be verified in collection")

    const tokenRecordRent = await umi.rpc.getBalance(getTokenRecordPda(newMint.publicKey, user.publicKey))
    const mintTokenRent = await umi.rpc.getBalance(newMint.publicKey)
    assert.equal(
      userBalBefore.basisPoints - userBalAfter.basisPoints,
      MINTING_FEE + CONVERT_FEE + tokenRecordRent.basisPoints + mintTokenRent.basisPoints + 5000n * 2n,
      "Expected to pay 0.01 sol MP fee, tokenRecord rent, new mint rent, and 2x tx fee"
    )
    const newCollectionAccount = await fetchDigitalAsset(umi, destinationCollection.publicKey)
    const newCollectionDetails = unwrapOptionRecursively(newCollectionAccount.metadata.collectionDetails)
    assert.equal(
      newCollectionDetails.__kind === "V1" && newCollectionDetails.size,
      1n,
      "Expected new collection size to be 1"
    )

    const collectionAccount = await fetchDigitalAsset(umi, sourceCollection.publicKey)
    const collectionDetails = unwrapOptionRecursively(collectionAccount.metadata.collectionDetails)
    assert.equal(
      collectionDetails.__kind === "V1" && collectionDetails.size,
      0n,
      "Expected old collection size to be 0"
    )
    const creators = unwrapOptionRecursively(pnft.metadata.creators)
    assert.ok(
      isEqual(creators, [
        {
          address: converter,
          share: 0,
          verified: true,
        },
        {
          address: unwrapOptionRecursively(nft.metadata.creators)[1].address,
          share: 100,
          verified: false,
        },
      ]),
      "Expected FVC to be replaced with the converter PDA"
    )
  })
})
