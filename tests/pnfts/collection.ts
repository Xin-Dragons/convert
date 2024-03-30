import * as anchor from "@coral-xyz/anchor"
import { createCollection } from "../helpers/create-collection"
import { adminSigner, umi } from "../helpers/umi"
import {
  DigitalAsset,
  MPL_TOKEN_METADATA_PROGRAM_ID,
  fetchDigitalAsset,
  fetchMetadataDelegateRecord,
  findMetadataPda,
  verifyCreatorV1,
} from "@metaplex-foundation/mpl-token-metadata"
import { findConverterPda, findMetadataDelegateRecord, findProgramConfigPda, getTokenRecordPda } from "../helpers/pdas"
import { CONVERT_FEE, MINTING_FEE, adminProgram, createNewUser, programPaidBy } from "../helper"
import { createNft } from "../helpers/create-nft"
import { KeypairSigner, PublicKey, generateSigner, sol, unwrapOptionRecursively } from "@metaplex-foundation/umi"
import { assert } from "chai"
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters"
import { isEqual } from "lodash"
import { assertErrorCode, expectFail } from "../helpers/utils"
import { Convert } from "../../target/types/convert"
import { closeConverter, convert, init } from "../helpers/instructions"

describe("With collection", () => {
  let sourceCollection: DigitalAsset
  let user: KeypairSigner
  let userProgram: anchor.Program<Convert>
  let nft: DigitalAsset
  let converter: PublicKey
  let authority: KeypairSigner
  const creator = generateSigner(umi)
  before(async () => {
    user = await createNewUser()
    userProgram = programPaidBy(user)
    authority = await createNewUser()
    sourceCollection = await createCollection(undefined, authority)
    nft = await createNft({
      isPnft: false,
      collection: sourceCollection.publicKey,
      owner: user.publicKey,
      authority,
      name: "Test NFT",
      symbol: "TEST",
      sellerFeeBasisPoints: 5,
      uri: "https://example.com",
      creators: [
        {
          address: creator.publicKey,
          share: 0,
          verified: false,
        },
        {
          address: authority.publicKey,
          share: 100,
          verified: false,
        },
      ],
    })
    await verifyCreatorV1(umi, {
      authority: creator,
      metadata: nft.metadata.publicKey,
    }).sendAndConfirm(umi)
    converter = findConverterPda(sourceCollection.publicKey)
  })

  it("Cannot create a converter with an invalid ruleset", async () => {
    const invalidRuleSet = await createCollection(undefined, authority)
    await expectFail(
      () =>
        init({
          user: authority,
          title: "Test project",
          slug: "test_project",
          logo: "12345",
          bg: "12345",
          nftMint: nft.publicKey,
          ruleSet: invalidRuleSet.publicKey,
        }),
      (err) => assertErrorCode(err, "InvalidRuleSet")
    )
  })

  it("Can create a new converter", async () => {
    await init({
      user: authority,
      title: "Test project",
      slug: "test_project",
      logo: "12345",
      bg: "12345",
      nftMint: nft.publicKey,
    })
    const converterAcc = await adminProgram.account.converter.fetch(converter)
    const collectionDelegateRecord = findMetadataDelegateRecord(
      fromWeb3JsPublicKey(converterAcc.destinationCollection),
      authority.publicKey,
      converter
    )
    const delegate = await fetchMetadataDelegateRecord(umi, collectionDelegateRecord)
    assert.equal(delegate.delegate, converter, "Expected converter to be the delegate")
  })

  it("Cannot convert while inactive", async () => {
    await expectFail(
      () => convert(user, converter, nft),
      (err) => assertErrorCode(err, "ConverterInactive")
    )
  })

  it("Can turn the converter on", async () => {
    await programPaidBy(authority).methods.toggleActive(true).accounts({ converter }).rpc()
    const converterAccount = await adminProgram.account.converter.fetch(converter)
    assert.ok(converterAccount.active, "Expected converter to be active")
  })

  it("cannot convert an NFT from a different collection", async () => {
    const newMint = generateSigner(umi)
    const invalidCollection = await createCollection(undefined, authority)
    const invalidNft = await createNft({
      isPnft: false,
      collection: invalidCollection.publicKey,
      uri: "",
      name: "",
      symbol: "",
      creators: null,
      sellerFeeBasisPoints: 0,
      authority: authority,
      owner: user.publicKey,
    })
    await expectFail(
      () => convert(user, converter, invalidNft),
      (err) => assertErrorCode(err, "InvalidCollection")
    )
  })

  it("Can convert an NFT to a pNFT", async () => {
    const userBalBefore = await umi.rpc.getBalance(user.publicKey)

    const newMint = await convert(user, converter, nft)

    const userBalAfter = await umi.rpc.getBalance(user.publicKey)

    const pnft = await fetchDigitalAsset(umi, newMint)

    assert.equal(pnft.metadata.name, nft.metadata.name, "Expected name to be cloned")
    assert.equal(pnft.metadata.symbol, nft.metadata.symbol, "Expected symbol to be cloned")
    assert.equal(pnft.metadata.uri, nft.metadata.uri, "Expected uri to be cloned")
    assert.equal(
      pnft.metadata.sellerFeeBasisPoints,
      nft.metadata.sellerFeeBasisPoints,
      "Expected sellerFeeBasisPoints to be cloned"
    )

    const converterAccount = await adminProgram.account.converter.fetch(converter)
    const destinationCollection = fromWeb3JsPublicKey(converterAccount.destinationCollection)
    const unwrappedCollection = unwrapOptionRecursively(pnft.metadata.collection)
    assert.equal(unwrappedCollection.key, destinationCollection, "Expected pNFT to be added to new collection")
    assert.ok(unwrappedCollection.verified, "Expected to be verified in collection")

    const tokenRecordRent = await umi.rpc.getBalance(getTokenRecordPda(newMint, user.publicKey))
    const mintTokenRent = await umi.rpc.getBalance(newMint)
    assert.equal(
      userBalBefore.basisPoints - userBalAfter.basisPoints,
      MINTING_FEE + CONVERT_FEE + tokenRecordRent.basisPoints + mintTokenRent.basisPoints + 5000n * 2n,
      "Expected to pay 0.01 sol MP fee, tokenRecord rent, new mint rent, and 2x tx fee"
    )
    const newCollectionAccount = await fetchDigitalAsset(umi, destinationCollection)
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

  it("can delete the converter as authority", async () => {
    const converterAcc = await adminProgram.account.converter.fetch(converter)
    await closeConverter({ user: authority, converter })
    const collectionDelegateRecord = findMetadataDelegateRecord(
      fromWeb3JsPublicKey(converterAcc.destinationCollection),
      fromWeb3JsPublicKey(converterAcc.authority),
      converter
    )
    const exists = await umi.rpc.accountExists(collectionDelegateRecord)
    assert.ok(!exists, "Expected delegate record to be closed")
  })
})
