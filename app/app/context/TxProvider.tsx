import { useState } from "react"
import { useConvert } from "./convert"
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters"
import { ConverterWithPublicKey } from "~/types/types"
import { useUmi } from "./umi"
import { fetchDigitalAsset } from "@metaplex-foundation/mpl-token-metadata"
import { findMetadataDelegateRecord } from "~/helpers/pdas"
import { unwrapOptionRecursively } from "@metaplex-foundation/umi"

export function TxProvider() {
  const [loading, setLoading] = useState(false)
  const program = useConvert()
  const umi = useUmi()

  async function deleteConverter(converter: ConverterWithPublicKey) {
    try {
      setLoading(true)

      const promise = Promise.resolve().then(async () => {
        const collectionMint = fromWeb3JsPublicKey(converter.account.destinationCollection)
        const collection = await fetchDigitalAsset(umi, collectionMint)
        const collectionDelegateRecord = findMetadataDelegateRecord(
          umi,
          collection.publicKey,
          collection?.metadata.updateAuthority,
          fromWeb3JsPublicKey(converter.publicKey)
        )
        const authorizationRules = unwrapOptionRecursively(collection.metadata.programmableConfig)?.ruleSet || null
        const isUa = collection.metadata.updateAuthority === umi.identity.publicKey
        const tx = transactionBuilder().add({
          instruction: fromWeb3JsInstruction(
            await program.methods
              .deleteConverter()
              .accounts({
                converter: converter.publicKey,
                program: isUa ? null : program.programId,
                programData: isUa ? null : findProgramDataAddress(umi),
                programConfig: findProgramConfigPda(umi),
                collectionMint,
                collectionMetadata: collection.metadata.publicKey,
                collectionDelegateRecord,
                tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
                authorizationRules,
                authorizationRulesProgram: authorizationRules ? MPL_TOKEN_AUTH_RULES_PROGRAM_ID : null,
                sysvarInstructions: getSysvar("instructions"),
              })
              .instruction()
          ),
          bytesCreatedOnChain: 0,
          signers: [umi.identity],
        })

        const { chunks, txFee } = await packTx(umi, tx, feeLevel)
        const signed = await Promise.all(chunks.map((c) => c.buildAndSign(umi)))
        return await sendAllTxsWithRetries(umi, program.provider.connection, signed, txFee ? 1 : 0)
      })

      toast.promise(promise, {
        loading: "Deleting converter",
        success: "Deleted successfully",
        error: (err) => displayErrorFromLog(err, "Error deleting converter"),
      })

      await promise

      navigate("/")
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
}
