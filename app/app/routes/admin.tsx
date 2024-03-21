import * as anchor from "@coral-xyz/anchor"
import { MPL_TOKEN_AUTH_RULES_PROGRAM_ID } from "@metaplex-foundation/mpl-token-auth-rules"
import {
  MPL_TOKEN_METADATA_PROGRAM_ID,
  TokenStandard,
  fetchDigitalAsset,
  fetchDigitalAssetWithTokenByMint,
} from "@metaplex-foundation/mpl-token-metadata"
import { getSysvar, setComputeUnitLimit, setComputeUnitPrice } from "@metaplex-foundation/mpl-toolbox"
import {
  deserializeAccount,
  publicKey,
  sol,
  transactionBuilder,
  unwrapOptionRecursively,
} from "@metaplex-foundation/umi"
import { fromWeb3JsInstruction, toWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters"
import { Button, Card, CardBody, Input, Spinner } from "@nextui-org/react"
import { LoaderFunction, json } from "@vercel/remix"
import { isRouteErrorResponse, useLoaderData, useRouteError } from "@remix-run/react"
import { useWallet } from "@solana/wallet-adapter-react"
import base58 from "bs58"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { ErrorMessage } from "~/components/ErrorMessage"
import { adminWallet } from "~/constants"
import { usePriorityFees } from "~/context/priority-fees"
import { useUmi } from "~/context/umi"
import { getPriorityFeesForTx } from "~/helpers/helius"
import { findProgramConfigPda, findProgramDataAddress, getTokenAccount, getTokenRecordPda } from "~/helpers/pdas"
import { convertProgram } from "~/helpers/convert.server"
import { umi } from "~/helpers/umi"
import { getAccount } from "~/helpers/index.server"
import { ProgramConfig } from "~/types/types"
import { packTx, sendAllTxsWithRetries } from "~/helpers"
import { useConvert } from "~/context/convert"

export default function Admin() {
  const { feeLevel } = usePriorityFees()
  const umi = useUmi()
  const [loading, setLoading] = useState(false)
  const convertProgram = useConvert()
  const wallet = useWallet()

  async function init() {
    try {
      setLoading(true)
      const promise = Promise.resolve().then(async () => {
        const tx = transactionBuilder().add({
          instruction: fromWeb3JsInstruction(
            await convertProgram.methods
              .initProgramConfig(new anchor.BN(sol(0.01).basisPoints.toString()))
              .accounts({
                programConfig: findProgramConfigPda(umi),
                programData: findProgramDataAddress(umi),
                program: convertProgram.programId,
              })
              .instruction()
          ),
          bytesCreatedOnChain: 8 + 8 + 1,
          signers: [umi.identity],
        })

        const { chunks, txFee } = await packTx(umi, tx, feeLevel)
        const signed = await Promise.all(chunks.map((c) => c.buildAndSign(umi)))
        return await sendAllTxsWithRetries(umi, convertProgram.provider.connection, signed, txFee ? 1 : 0)
      })

      toast.promise(promise, {
        loading: "Initialising config",
        success: "Successfully initialised config",
        error: "Error initialising config",
      })

      await promise
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!wallet.publicKey) {
    return <ErrorMessage title="Wallet disconnected" />
  }

  if (wallet.publicKey.toBase58() !== adminWallet) {
    return <ErrorMessage title="Unauthorized" content="The connected wallet cannot access this resource" />
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <Button onClick={init} disabled={loading}>
          Init
        </Button>
      </div>

      {/* <Recover /> */}
      {/* <UpdateProgramConfig programConfig={programConfig} /> */}
    </div>
  )
}

// function UpdateProgramConfig({ programConfig }: { programConfig: ProgramConfig }) {
//   const umi = useUmi()
//   const { feeLevel } = usePriorityFees()
//   const [loading, setLoading] = useState(false)
//   const [proceedsShare, setProceedsShare] = useState(programConfig.proceedsShare.toString())
//   const program = useConvert()

//   async function updateProgramConfig() {
//     try {
//       setLoading(true)
//       const promise = Promise.resolve().then(async () => {
//         let tx = transactionBuilder().add({
//           instruction: fromWeb3JsInstruction(
//             await program.methods
//               .updateProgramConfig(null, Number(proceedsShare))
//               .accounts({
//                 programConfig: findProgramConfigPda(umi),
//                 program: program.programId,
//                 programData: findProgramDataAddress(umi),
//               })
//               .instruction()
//           ),
//           bytesCreatedOnChain: 0,
//           signers: [umi.identity],
//         })

//         const { chunks, txFee } = await packTx(umi, tx, feeLevel)
//         const signed = await Promise.all(chunks.map((c) => c.buildAndSign(umi)))
//         return await sendAllTxsWithRetries(umi, program.provider.connection, signed, 1 + (txFee ? 1 : 0))
//       })

//       toast.promise(promise, {
//         loading: "Updating program config",
//         success: "Updated successfully",
//         error: "Error updating",
//       })

//       await promise
//     } catch (err) {
//       console.error(err)
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <Card>
//       <CardBody className="flex flex-col gap-3">
//         <Input type="number" label="Proceeds share" value={proceedsShare} onValueChange={setProceedsShare} />
//         <Button onClick={updateProgramConfig}>Update</Button>
//       </CardBody>
//     </Card>
//   )
// }

// function Recover() {
//   const { feeLevel } = usePriorityFees()
//   const convertProgram = useRaffle()
//   const [mint, setMint] = useState("")
//   const [destination, setDestination] = useState("")
//   const [entrants, setEntrants] = useState("")
//   const [loading, setLoading] = useState(false)
//   const umi = useUmi()

//   async function recover() {
//     try {
//       setLoading(true)
//       const promise = Promise.resolve().then(async () => {
//         const nft = await fetchDigitalAssetWithTokenByMint(umi, publicKey(mint))
//         const isPnft = unwrapOptionRecursively(nft.metadata.tokenStandard) === TokenStandard.ProgrammableNonFungible
//         const destinationPk = destination ? publicKey(destination) : umi.identity.publicKey

//         let tx = transactionBuilder().add({
//           instruction: fromWeb3JsInstruction(
//             await convertProgram.methods
//               .recoverNft()
//               .accounts({
//                 nftMint: nft.publicKey,
//                 destination: destinationPk,
//                 nftDestination: getTokenAccount(umi, nft.publicKey, destinationPk),
//                 nftMetadata: nft.metadata.publicKey,
//                 nftEdition: nft.edition?.publicKey,
//                 nftSource: nft.token.publicKey,
//                 raffle: nft.token.owner,
//                 sourceTokenRecord: isPnft ? getTokenRecordPda(umi, nft.publicKey, nft.token.owner) : null,
//                 destinationTokenRecord: isPnft ? getTokenRecordPda(umi, nft.publicKey, destinationPk) : null,
//                 entrants,
//                 programData: findProgramDataAddress(),
//                 program: convertProgram.programId,
//                 authRules: isPnft ? unwrapOptionRecursively(nft.metadata.programmableConfig)?.ruleSet : null,
//                 authRulesProgram: MPL_TOKEN_AUTH_RULES_PROGRAM_ID,
//                 metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
//                 sysvarInstructions: getSysvar("instructions"),
//               })
//               .instruction()
//           ),
//           bytesCreatedOnChain: 0,
//           signers: [umi.identity],
//         })

//         const { chunks, txFee } = await packTx(umi, tx, feeLevel, 500_000)
//         const signed = await Promise.all(chunks.map((c) => c.buildAndSign(umi)))
//         return await sendAllTxsWithRetries(umi, convertProgram.provider.connection, signed, 1 + (txFee ? 1 : 0))
//       })

//       toast.promise(promise, {
//         loading: "Recovering NFT",
//         success: "Successfully recovered NFT",
//         error: "Error recovering NFT",
//       })

//       await promise
//     } catch (err: any) {
//       console.error(err)
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <Card>
//       <CardBody className="flex flex-col gap-3">
//         <p>Recover NFT</p>
//         <Input label="NFT Mint" value={mint} onValueChange={setMint} />
//         <Input label="Entrants" value={entrants} onValueChange={setEntrants} />
//         <Input label="Destination" value={destination} onValueChange={setDestination} />
//         <Button onClick={recover}>Recover</Button>
//       </CardBody>
//     </Card>
//   )
// }
