import { adminProgram, createNewUser, programPaidBy } from "../helper"
import { createCollection } from "../helpers/create-collection"
import { createNft } from "../helpers/create-nft"
import { umi } from "../helpers/umi"
import {
  FEES_WALLET,
  findConverterPda,
  findProgramDataAddress,
  getTokenAccount,
  getTokenRecordPda,
} from "../helpers/pdas"
import { ExtensionType, fetchAsset, getExtension } from "@nifty-oss/asset"
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters"
import { KeypairSigner, PublicKey, generateSigner, sol, unwrapOptionRecursively } from "@metaplex-foundation/umi"
import { DigitalAsset } from "@metaplex-foundation/mpl-token-metadata"
import { closeNiftyConverter, convertNifty, initNifty } from "../helpers/instructions"
import { assert } from "chai"
import { isEqual, omit } from "lodash"

describe.only("Nifty - happy path", () => {
  const creator1 = generateSigner(umi).publicKey
  const creator2 = generateSigner(umi).publicKey
  let authority: KeypairSigner
  let user: KeypairSigner
  let sourceCollection: DigitalAsset
  let nft: DigitalAsset
  let converterPda: PublicKey

  before(async () => {
    authority = await createNewUser()
    user = await createNewUser()
    sourceCollection = await createCollection(undefined, authority)
    converterPda = findConverterPda(sourceCollection.publicKey)

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
          address: creator1,
          share: 0,
          verified: false,
        },
        {
          address: creator2,
          share: 75,
          verified: false,
        },
        {
          address: authority.publicKey,
          share: 25,
          verified: true,
        },
      ],
    })
  })

  it("can create a new converter", async () => {
    const name = "Nifty collection"
    const description = "This is a collection that's being converted to Nifty"
    const slug = "nifty_collection"
    const uri = nft.metadata.uri

    await initNifty({
      authority,
      collection: sourceCollection.publicKey,
      nftMint: nft.publicKey,
      name,
      description,
      slug,
      uri,
      maxSize: 10n,
    })

    await programPaidBy(authority)
      .methods.toggleActive(true)
      .accounts({
        converter: converterPda,
      })
      .rpc()
  })

  it("creates a new group asset", async () => {
    const converter = await adminProgram.account.converter.fetch(converterPda)
    const asset = await fetchAsset(umi, fromWeb3JsPublicKey(converter.destinationCollection))

    assert.equal(asset.authority, authority.publicKey)

    const grouping = getExtension(asset, ExtensionType.Grouping)
    assert.equal(grouping.maxSize, 10n, "Expected maxSize to be set")
    assert.equal(grouping.delegate, converterPda, "Expected converter to be the group delegate")

    const royalties = getExtension(asset, ExtensionType.Royalties)
    assert.equal(royalties.basisPoints, 500, "Expected royalties to be 500 basis points")

    const creators = getExtension(asset, ExtensionType.Creators)
    assert.ok(
      isEqual(
        unwrapOptionRecursively(nft.metadata.creators)
          .filter((c) => c.share)
          .map((c) => omit(c, "verified")),
        creators.creators.map((c) => omit(c, "verified"))
      ),
      "Expected non-nil creators to be copied over, ignoring verified status"
    )
  })

  it("Can convert to a Nifty NFT", async () => {
    const program = programPaidBy(user)
    const converter = findConverterPda(sourceCollection.publicKey)
    const converterAccount = await program.account.converter.fetch(converter)
    const destinationCollection = await fetchAsset(umi, fromWeb3JsPublicKey(converterAccount.destinationCollection))

    const feesBalBefore = await umi.rpc.getBalance(FEES_WALLET)
    const tokenAccBalBefore = (await umi.rpc.getBalance(getTokenAccount(nft.publicKey, user.publicKey))).basisPoints
    const metadataAccBalanceBefore =
      (await umi.rpc.getBalance(nft.metadata.publicKey)).basisPoints - sol(0.01).basisPoints
    const masterEditionBalanceBefore = (await umi.rpc.getBalance(nft.edition.publicKey)).basisPoints

    const userBalBefore = await umi.rpc.getBalance(user.publicKey)
    const newMint = await convertNifty(user, converter, nft)
    const userBalAfter = await umi.rpc.getBalance(user.publicKey)

    const assetBalance = (await umi.rpc.getBalance(newMint)).basisPoints

    const feesBalAfter = await umi.rpc.getBalance(FEES_WALLET)

    const burningProceeds = tokenAccBalBefore + metadataAccBalanceBefore + masterEditionBalanceBefore

    assert.equal(
      userBalBefore.basisPoints - userBalAfter.basisPoints,
      assetBalance + sol(0.01).basisPoints + 5000n * 2n - burningProceeds,
      "Expected to have paid the tx fee"
    )

    console.log(assetBalance)

    assert.equal(
      feesBalAfter.basisPoints - feesBalBefore.basisPoints,
      10000000n,
      "Expected fees wallet to receive 0.01 sol"
    )

    const asset = await fetchAsset(umi, newMint)
    assert.equal(asset.name, nft.metadata.name)
    assert.equal(asset.group, destinationCollection.publicKey, "Expected asset to be included in the parent group")

    const metadata = getExtension(asset, ExtensionType.Metadata)
    assert.equal(metadata.uri, nft.metadata.uri)
    assert.equal(metadata.symbol, nft.metadata.symbol)
  })

  it("Can convert a pNFT to a Nifty NFT", async () => {
    const nft = await createNft({
      isPnft: true,
      collection: sourceCollection.publicKey,
      owner: user.publicKey,
      authority,
      name: "Test NFT with a longer title",
      symbol: "TEST",
      sellerFeeBasisPoints: 5,
      uri: "https://example.com/?q=12345678901234567890123456789012345678901234567890234567890",
      creators: [
        {
          address: creator1,
          share: 0,
          verified: false,
        },
        {
          address: creator2,
          share: 75,
          verified: false,
        },
        {
          address: authority.publicKey,
          share: 25,
          verified: true,
        },
      ],
    })

    const userBalBefore = await umi.rpc.getBalance(user.publicKey)

    const program = programPaidBy(user)
    const converter = findConverterPda(sourceCollection.publicKey)
    const converterAccount = await program.account.converter.fetch(converter)
    const destinationCollection = await fetchAsset(umi, fromWeb3JsPublicKey(converterAccount.destinationCollection))

    const feesBalBefore = await umi.rpc.getBalance(FEES_WALLET)
    const tokenAccBalBefore = (await umi.rpc.getBalance(getTokenAccount(nft.publicKey, user.publicKey))).basisPoints
    const metadataAccBalanceBefore =
      (await umi.rpc.getBalance(nft.metadata.publicKey)).basisPoints - sol(0.01).basisPoints
    const masterEditionBalanceBefore = (await umi.rpc.getBalance(nft.edition.publicKey)).basisPoints
    const tokenRecordBalanceBefore = (await umi.rpc.getBalance(getTokenRecordPda(nft.publicKey, user.publicKey)))
      .basisPoints

    const newMint = await convertNifty(user, converter, nft)

    const userBalAfter = await umi.rpc.getBalance(user.publicKey)

    const assetBalance = (await umi.rpc.getBalance(newMint)).basisPoints

    const feesBalAfter = await umi.rpc.getBalance(FEES_WALLET)

    const burningProceeds =
      tokenAccBalBefore + metadataAccBalanceBefore + masterEditionBalanceBefore + tokenRecordBalanceBefore

    assert.equal(
      userBalBefore.basisPoints - userBalAfter.basisPoints,
      assetBalance + sol(0.01).basisPoints + 5000n * 2n - burningProceeds,
      "Expected to have paid the tx fee"
    )

    console.log(assetBalance + sol(0.01).basisPoints + 5000n * 2n - burningProceeds)

    assert.equal(
      feesBalAfter.basisPoints - feesBalBefore.basisPoints,
      10000000n,
      "Expected fees wallet to receive the difference"
    )

    const asset = await fetchAsset(umi, newMint)
    assert.equal(asset.name, nft.metadata.name)
    assert.equal(asset.group, destinationCollection.publicKey, "Expected asset to be included in the parent group")

    const metadata = getExtension(asset, ExtensionType.Metadata)
    assert.equal(metadata.uri, nft.metadata.uri)
    assert.equal(metadata.symbol, nft.metadata.symbol)
  })

  it("can update the converter to be free", () => {
    adminProgram.methods
      .toggleFreeMode(true)
      .accounts({
        converter: converterPda,
        programData: findProgramDataAddress(),
        program: adminProgram.programId,
      })
      .rpc()
  })

  it("can convert for free", async () => {
    const nft = await createNft({
      isPnft: true,
      collection: sourceCollection.publicKey,
      owner: user.publicKey,
      authority,
      name: "Test NFT with a longer title",
      symbol: "TEST",
      sellerFeeBasisPoints: 5,
      uri: "https://example.com/?q=12345678901234567890123456789012345678901234567890234567890",
      creators: [
        {
          address: creator1,
          share: 0,
          verified: false,
        },
        {
          address: creator2,
          share: 75,
          verified: false,
        },
        {
          address: authority.publicKey,
          share: 25,
          verified: true,
        },
      ],
    })

    const program = programPaidBy(user)
    const converter = findConverterPda(sourceCollection.publicKey)
    const converterAccount = await program.account.converter.fetch(converter)
    const destinationCollection = await fetchAsset(umi, fromWeb3JsPublicKey(converterAccount.destinationCollection))

    const feesBalBefore = await umi.rpc.getBalance(FEES_WALLET)
    const tokenAccBalBefore = (await umi.rpc.getBalance(getTokenAccount(nft.publicKey, user.publicKey))).basisPoints
    const metadataAccBalanceBefore =
      (await umi.rpc.getBalance(nft.metadata.publicKey)).basisPoints - sol(0.01).basisPoints
    const masterEditionBalanceBefore = (await umi.rpc.getBalance(nft.edition.publicKey)).basisPoints
    const tokenRecordBalanceBefore = (await umi.rpc.getBalance(getTokenRecordPda(nft.publicKey, user.publicKey)))
      .basisPoints

    const userBalBefore = await umi.rpc.getBalance(user.publicKey)
    const newMint = await convertNifty(user, converter, nft)
    const userBalAfter = await umi.rpc.getBalance(user.publicKey)

    const assetBalance = await umi.rpc.getBalance(newMint)

    const feesBalAfter = await umi.rpc.getBalance(FEES_WALLET)

    const burningProceeds =
      tokenAccBalBefore + metadataAccBalanceBefore + masterEditionBalanceBefore + tokenRecordBalanceBefore

    assert.equal(feesBalAfter.basisPoints - feesBalBefore.basisPoints, 0n, "Expected no fee to be taken")

    assert.equal(
      burningProceeds - assetBalance.basisPoints,
      userBalAfter.basisPoints - userBalBefore.basisPoints + 5000n * 2n,
      "Expected user to receive the difference"
    )

    const asset = await fetchAsset(umi, newMint)
    assert.equal(asset.name, nft.metadata.name)
    assert.equal(asset.group, destinationCollection.publicKey, "Expected asset to be included in the parent group")

    const metadata = getExtension(asset, ExtensionType.Metadata)
    assert.equal(metadata.uri, nft.metadata.uri)
    assert.equal(metadata.symbol, nft.metadata.symbol)
  })

  it("Can close the converter, clearing the authority", async () => {
    const destinationCollection = fromWeb3JsPublicKey(
      (await adminProgram.account.converter.fetch(converterPda)).destinationCollection
    )
    await closeNiftyConverter(authority, converterPda)
    const asset = await fetchAsset(umi, destinationCollection)
    const grouping = getExtension(asset, ExtensionType.Grouping)
    assert.equal(grouping.delegate, null, "Expected delegate to be cleared")
  })
})
