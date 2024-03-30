import { createProgrammableNft, fetchDigitalAsset } from "@metaplex-foundation/mpl-token-metadata"
import {
  generateSigner,
  percentAmount,
  transactionBuilder,
  type Umi,
  KeypairSigner,
  signerIdentity,
} from "@metaplex-foundation/umi"
import { createCollectionV1, fetchCollectionV1 } from "@metaplex-foundation/mpl-core"
import { getUmi, umi as defaultUmi } from "./umi"

export async function createCollection(collection?: KeypairSigner, authority?: KeypairSigner) {
  const umi = authority ? getUmi(authority) : defaultUmi
  collection = collection || generateSigner(umi)
  await transactionBuilder()
    .add(
      createProgrammableNft(umi, {
        mint: collection,
        isCollection: true,
        name: "Test Collection",
        uri: "",
        sellerFeeBasisPoints: percentAmount(0),
      })
    )
    .sendAndConfirm(umi)

  const da = await fetchDigitalAsset(umi, collection.publicKey)
  return da
}

export async function createCoreCollection(collection: KeypairSigner, authority?: KeypairSigner) {
  const umi = authority ? getUmi(authority) : defaultUmi
  collection = collection || generateSigner(umi)

  await createCollectionV1(umi, {
    collection,
    name: "Test Core Collection",
    uri: "",
  }).sendAndConfirm(umi)

  const collectionDa = await fetchCollectionV1(umi, collection.publicKey)
  return collectionDa
}
