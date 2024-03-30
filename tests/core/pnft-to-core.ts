import * as anchor from "@coral-xyz/anchor"
import { createCollection } from "../helpers/create-collection"
import { umi } from "../helpers/umi"
import { DigitalAsset, fetchDigitalAsset, verifyCreatorV1 } from "@metaplex-foundation/mpl-token-metadata"
import { FEES_WALLET, findConverterPda, getTokenAccount, getTokenRecordPda } from "../helpers/pdas"
import { adminProgram, createNewUser, programPaidBy } from "../helper"
import { createNft } from "../helpers/create-nft"
import { KeypairSigner, PublicKey, generateSigner, sol, unwrapOptionRecursively } from "@metaplex-foundation/umi"
import { assert } from "chai"
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters"
import { isEqual } from "lodash"
import { assertErrorCode, expectFail } from "../helpers/utils"
import { Convert } from "../../target/types/convert"
import { closeCoreConverter, convertCore, initCore } from "../helpers/instructions"
import { fetchAssetV1, fetchCollectionV1 } from "@metaplex-foundation/mpl-core"

describe("Core - pNFT", () => {
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
      isPnft: true,
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

  it("Can create a new converter", async () => {
    await initCore({
      user: authority,
      title: "Test project",
      slug: "test_project",
      logo: "12345",
      bg: "12345",
      nftMint: nft.publicKey,
    })
  })

  it("Cannot convert while inactive", async () => {
    await expectFail(
      () => convertCore(user, converter, nft),
      (err) => assertErrorCode(err, "ConverterInactive")
    )
  })

  it("Can turn the converter on", async () => {
    await programPaidBy(authority).methods.toggleActive(true).accounts({ converter }).rpc()
    const converterAccount = await adminProgram.account.converter.fetch(converter)
    assert.ok(converterAccount.active, "Expected converter to be active")
  })

  it("cannot convert an NFT from a different collection", async () => {
    const invalidCollection = await createCollection(undefined, authority)
    const invalidNft = await createNft({
      isPnft: true,
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
      () => convertCore(user, converter, invalidNft),
      (err) => assertErrorCode(err, "InvalidCollection")
    )
  })

  it("Can convert an NFT to a Core NFT", async () => {
    const userBalBefore = await umi.rpc.getBalance(user.publicKey)
    const tokenAccBalBefore = (await umi.rpc.getBalance(getTokenAccount(nft.publicKey, user.publicKey))).basisPoints
    // 0.01 sol is witheld by the program for legacy minting fee
    const feesBalanceBefore = (await umi.rpc.getBalance(FEES_WALLET)).basisPoints
    const metadataAccBalanceBefore =
      (await umi.rpc.getBalance(nft.metadata.publicKey)).basisPoints - sol(0.01).basisPoints
    const masterEditionBalanceBefore = (await umi.rpc.getBalance(nft.edition.publicKey)).basisPoints
    const tokenRecordBalanceBefore = (await umi.rpc.getBalance(getTokenRecordPda(nft.publicKey, user.publicKey)))
      .basisPoints

    const newAsset = await convertCore(user, converter, nft)
    const converterAccount = await adminProgram.account.converter.fetch(converter)

    const userBalAfter = await umi.rpc.getBalance(user.publicKey)

    const coreNft = await fetchAssetV1(umi, newAsset)

    const feesBalanceAfter = (await umi.rpc.getBalance(FEES_WALLET)).basisPoints

    assert.equal(coreNft.name, nft.metadata.name, "Expected name to be cloned")
    assert.equal(coreNft.uri, nft.metadata.uri, "Expected uri to be cloned")
    assert.equal(coreNft.updateAuthority.type, "Collection", "Expected update authority type to be set to collection")
    assert.equal(
      coreNft.updateAuthority.address,
      fromWeb3JsPublicKey(converterAccount.destinationCollection),
      "Expected update authority to be set to the collection"
    )

    assert.equal(coreNft.owner, user.publicKey, "Expected user to own the asset")

    const assetBalance = (await umi.rpc.getBalance(newAsset)).basisPoints

    const burningProceeds =
      tokenAccBalBefore + metadataAccBalanceBefore + masterEditionBalanceBefore + tokenRecordBalanceBefore

    assert.equal(userBalBefore.basisPoints - userBalAfter.basisPoints, 5000n * 2n, "Expected to pay 2x tx fee")

    assert.equal(
      feesBalanceAfter - feesBalanceBefore,
      burningProceeds - assetBalance,
      "Expected fees wallet to receive the difference"
    )

    const collection = await fetchCollectionV1(umi, fromWeb3JsPublicKey(converterAccount.destinationCollection))
    assert.equal(collection.numMinted, 1, "Expected num minted to be 1")
    assert.equal(collection.currentSize, 1, "Expected current size to be 1")

    const collectionAccount = await fetchDigitalAsset(umi, sourceCollection.publicKey)
    const collectionDetails = unwrapOptionRecursively(collectionAccount.metadata.collectionDetails)
    assert.equal(
      collectionDetails.__kind === "V1" && collectionDetails.size,
      0n,
      "Expected old collection size to be 0"
    )
  })

  it("can close the converter as authority", async () => {
    const converterAcc = await adminProgram.account.converter.fetch(converter)
    await closeCoreConverter(authority, converter)
    const collectionAcc = await fetchCollectionV1(umi, fromWeb3JsPublicKey(converterAcc.destinationCollection))
    assert.equal(collectionAcc.updateDelegate, null, "Expected update delegate to be removed")
  })
})
