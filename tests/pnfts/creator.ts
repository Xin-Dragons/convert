import * as anchor from "@coral-xyz/anchor"
import { DigitalAsset, verifyCreatorV1 } from "@metaplex-foundation/mpl-token-metadata"
import { KeypairSigner, PublicKey, generateSigner } from "@metaplex-foundation/umi"
import { Convert } from "../../target/types/convert"
import { createNewUser, programPaidBy } from "../helper"
import { createCollection } from "../helpers/create-collection"
import { umi } from "../helpers/umi"
import { createNft } from "../helpers/create-nft"
import { findConverterPda } from "../helpers/pdas"
import { assertErrorCode, expectFail } from "../helpers/utils"
import { convert, init } from "../helpers/instructions"

describe("creator", () => {
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

    nft = await createNft({
      isPnft: false,
      collection: null,
      authority: authority,
      owner: user.publicKey,
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
    converter = findConverterPda(creator.publicKey)
  })

  it("can create a converter as the UA", async () => {
    await init({
      user: authority,
      title: "Test project",
      slug: "creator_project",
      logo: "12345",
      bg: "12345",
      nftMint: nft.publicKey,
    })
  })

  it("can activate the converter", async () => {
    await programPaidBy(authority).methods.toggleActive(true).accounts({ converter }).rpc()
  })

  it("Can convert an NFT to a pNFT", async () => {
    await convert(user, converter, nft)
  })

  it("Cannot convert an NFT from a differnt collection to a pNFT", async () => {
    const creator = generateSigner(umi)
    const nft = await createNft({
      isPnft: false,
      collection: null,
      authority: authority,
      owner: user.publicKey,
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

    await expectFail(
      () => convert(user, converter, nft),
      (err) => assertErrorCode(err, "InvalidCollection")
    )
  })

  // it("Cannot create a converter with an invalid ruleset", async () => {
  //   const invalidRuleSet = await createCollection(umi)
  //   await expectFail(
  //     () =>
  //       init(
  //         authority,
  //         "Test project",
  //         "test_project",
  //         "12345",
  //         "12345",
  //         sourceCollection.publicKey,
  //         invalidRuleSet.publicKey
  //       ),
  //     (err) => assertErrorCode(err, "InvalidRuleSet")
  //   )
  // })
})
