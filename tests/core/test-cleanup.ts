import * as anchor from "@coral-xyz/anchor"
import { createCollection } from "../helpers/create-collection"
import { umi } from "../helpers/umi"
import { DigitalAsset, verifyCreatorV1 } from "@metaplex-foundation/mpl-token-metadata"
import { findConverterPda } from "../helpers/pdas"
import { createNewUser, programPaidBy } from "../helper"
import { createNft } from "../helpers/create-nft"
import { KeypairSigner, PublicKey, generateSigner, sol, unwrapOptionRecursively } from "@metaplex-foundation/umi"
import { Convert } from "../../target/types/convert"
import { initCore } from "../helpers/instructions"

describe("Core - test cleanup TODO", () => {
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

  it("Can create a new converter", async () => {
    await initCore({
      user: authority,
      title: "Test project",
      slug: "test_cleanup",
      logo: "12345",
      bg: "12345",
      nftMint: nft.publicKey,
    })
  })
  // TODO - this functionality is currently broken in Core
  // it("can close the converter as authority, burning the original core collection", async () => {
  //   const converterAcc = await adminProgram.account.converter.fetch(converter)
  //   const collectionAcc = await fetchCollectionV1(umi, fromWeb3JsPublicKey(converterAcc.destinationCollection))
  //   console.log(collectionAcc)
  //   await expectFail(
  //     () => closeCoreConverter(authority, converter),
  //     (err) => console.log(err)
  //   )
  //   const collectionAccExists = await umi.rpc.accountExists(fromWeb3JsPublicKey(converterAcc.destinationCollection))
  //   assert.ok(!collectionAccExists, "Expected core collection asset to be burned")
  // })
})
