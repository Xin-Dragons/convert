import {
  createProgrammableNft,
  fetchDigitalAsset,
  findMetadataPda,
  verifyCollectionV1,
  createNft as createStandardNft,
  transferV1,
  TokenStandard,
  Creator,
} from "@metaplex-foundation/mpl-token-metadata"
import {
  generateSigner,
  percentAmount,
  some,
  type PublicKey,
  type Umi,
  transactionBuilder,
  none,
  publicKey,
  KeypairSigner,
  signerIdentity,
} from "@metaplex-foundation/umi"
import { getTokenAccount } from "./pdas"
import { getUmi, umi as defaultUmi } from "./umi"

const METAPLEX_RULE_SET = publicKey("eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9")
const COMPATIBILITY_RULE_SET = publicKey("AdH2Utn6Fus15ZhtenW4hZBQnvtLgM1YCW2MfVp7pYS5")

export async function createNft({
  isPnft = false,
  collection,
  authority,
  name,
  uri,
  symbol,
  sellerFeeBasisPoints,
  creators,
  owner,
}: {
  isPnft: boolean
  collection?: PublicKey
  authority?: KeypairSigner
  name: string
  uri: string
  symbol: string
  sellerFeeBasisPoints: number
  creators: Creator[]
  owner: PublicKey
}) {
  const umi = authority ? getUmi(authority) : defaultUmi
  const mint = generateSigner(umi)

  let txn = transactionBuilder()

  if (isPnft) {
    txn = txn.add(
      createProgrammableNft(umi, {
        mint,
        uri,
        name,
        symbol,
        collection: collection ? some({ key: collection, verified: false }) : none(),
        sellerFeeBasisPoints: percentAmount(sellerFeeBasisPoints),
        creators,
        ruleSet: METAPLEX_RULE_SET,
      })
    )
  } else {
    txn = txn.add(
      createStandardNft(umi, {
        mint,
        uri,
        name,
        symbol,
        collection: collection ? some({ key: collection, verified: false }) : none(),
        sellerFeeBasisPoints: percentAmount(sellerFeeBasisPoints),
        creators,
      })
    )
  }

  if (collection) {
    txn = txn.add(
      verifyCollectionV1(umi, {
        collectionMint: collection,
        metadata: findMetadataPda(umi, { mint: mint.publicKey }),
      })
    )
  }

  if (owner) {
    txn = txn.add(
      transferV1(umi, {
        mint: mint.publicKey,
        destinationToken: getTokenAccount(mint.publicKey, owner),
        destinationOwner: owner,
        tokenStandard: isPnft ? TokenStandard.ProgrammableNonFungible : TokenStandard.NonFungible,
      })
    )
  }

  await txn.sendAndConfirm(umi)
  const da = await fetchDigitalAsset(umi, mint.publicKey)
  return da
}
