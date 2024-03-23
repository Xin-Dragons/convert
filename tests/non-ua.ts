import * as anchor from "@coral-xyz/anchor"
import {
  DigitalAsset,
  MPL_TOKEN_METADATA_PROGRAM_ID,
  TokenStandard,
  fetchDigitalAsset,
  fetchMetadataDelegateRecord,
  findMetadataPda,
  verifyCreatorV1,
} from "@metaplex-foundation/mpl-token-metadata"
import { createCollection } from "./helpers/create-collection"
import { KeypairSigner, PublicKey, generateSigner, unwrapOptionRecursively } from "@metaplex-foundation/umi"
import { umi } from "./helpers/umi"
import { adminProgram, createNewUser, programPaidBy } from "./helper"
import { createNft } from "./helpers/create-nft"
import { convert, initUnapproved } from "./helpers/instructions"
import {
  findConverterPda,
  findMetadataDelegateRecord,
  findProgramConfigPda,
  findProgramDataAddress,
} from "./helpers/pdas"
import { assert } from "chai"
import { assertErrorCode, expectFail } from "./helpers/utils"
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters"
import { MPL_TOKEN_AUTH_RULES_PROGRAM_ID } from "@metaplex-foundation/mpl-token-auth-rules"
import { getSysvar } from "@metaplex-foundation/mpl-toolbox"

describe("non-ua", () => {
  const creator = generateSigner(umi)
  let authority: KeypairSigner
  let nft: DigitalAsset
  let user: KeypairSigner
  let user2: KeypairSigner
  let converter: PublicKey
  before(async () => {
    authority = await createNewUser()
    user = await createNewUser()
    user2 = await createNewUser()
    nft = await createNft({
      authority,
      owner: user2.publicKey,
      name: "A name",
      uri: "a uri",
      symbol: "a symbol",
      creators: [
        {
          share: 0,
          verified: false,
          address: creator.publicKey,
        },
        {
          share: 100,
          verified: false,
          address: authority.publicKey,
        },
      ],
      sellerFeeBasisPoints: 5,
      isPnft: false,
    })
    await verifyCreatorV1(umi, {
      authority: creator,
      metadata: nft.metadata.publicKey,
    }).sendAndConfirm(umi)
    converter = findConverterPda(creator.publicKey)
  })

  it("can create a new converter as non-ua", async () => {
    await initUnapproved({
      user,
      title: "Non approved",
      slug: "semi_created",
      logo: null,
      bg: null,
      nftMint: nft.publicKey,
    })

    const acc = await adminProgram.account.converter.fetch(converter)
    assert.ok(
      acc.sourceCollection.equals(anchor.web3.PublicKey.default),
      "Expected source collection to equal the default pk"
    )
  })

  it("Cannot convert", async () => {
    await expectFail(
      () => convert(user2, converter, nft),
      (err) => assertErrorCode(err, "ConstraintSeeds")
    )
  })

  it("cannot approve an unapproved converter as non-admin", async () => {
    await expectFail(
      () =>
        programPaidBy(user)
          .methods.approve()
          .accounts({
            converter,
            program: adminProgram.programId,
            programData: findProgramDataAddress(),
            collectionIdentifier: creator.publicKey,
          })
          .rpc(),
      (err) => assertErrorCode(err, "AdminOnly")
    )
  })

  it("can approve an unapproved converter as sysadmin", async () => {
    await adminProgram.methods
      .approve()
      .accounts({
        converter,
        program: adminProgram.programId,
        programData: findProgramDataAddress(),
        collectionIdentifier: creator.publicKey,
      })
      .rpc()

    const acc = await adminProgram.account.converter.fetch(converter)
    assert.equal(acc.sourceCollection.toBase58(), creator.publicKey)
  })

  it("Can activate the converter", async () => {
    await programPaidBy(user).methods.toggleActive(true).accounts({ converter }).rpc()
  })

  it("can convert an NFT", async () => {
    const nftMint = await convert(user2, converter, nft)
    const nftDa = await fetchDigitalAsset(umi, nftMint)
    assert.equal(
      unwrapOptionRecursively(nftDa.metadata.tokenStandard),
      TokenStandard.ProgrammableNonFungible,
      "Expected to mint a new pNFT"
    )
  })

  it("can delete the converter as system admin", async () => {
    const converterAcc = await adminProgram.account.converter.fetch(converter)
    const collectionMint = fromWeb3JsPublicKey(converterAcc.destinationCollection)
    const collection = await fetchDigitalAsset(umi, collectionMint)
    const collectionDelegateRecord = findMetadataDelegateRecord(
      collectionMint,
      collection.metadata.updateAuthority,
      converter
    )
    const authorizationRules = unwrapOptionRecursively(collection.metadata.programmableConfig).ruleSet || null
    const accBefore = await umi.rpc.getAccount(findProgramConfigPda())
    await adminProgram.methods
      .deleteConverter()
      .accounts({
        programConfig: findProgramConfigPda(),
        program: adminProgram.programId,
        programData: findProgramDataAddress(),
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
      .catch((err) => console.log(err))

    const accAfter = await umi.rpc.getAccount(findProgramConfigPda())
    assert.equal(
      accBefore.exists && accBefore.data.length,
      accAfter.exists && accAfter.data.length + 54,
      "Expected data length to be reduced by 54 bytes"
    )
    const exists = await umi.rpc.accountExists(collectionDelegateRecord)
    assert.ok(exists, "Expected delegate record to still exist")
  })
})
