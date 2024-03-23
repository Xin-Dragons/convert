import { createProgrammableNft, fetchDigitalAsset } from "@metaplex-foundation/mpl-token-metadata"
import {
  generateSigner,
  percentAmount,
  transactionBuilder,
  type Umi,
  KeypairSigner,
  signerIdentity,
} from "@metaplex-foundation/umi"
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
