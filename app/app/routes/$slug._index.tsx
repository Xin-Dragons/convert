import { ArrowDownIcon, ArrowRightIcon } from "@heroicons/react/24/outline"
import {
  fetchDigitalAsset,
  findMetadataPda,
  findMasterEditionPda,
  MPL_TOKEN_METADATA_PROGRAM_ID,
  DigitalAsset,
  JsonMetadata,
  fetchJsonMetadata,
} from "@metaplex-foundation/mpl-token-metadata"
import { getSysvar } from "@metaplex-foundation/mpl-toolbox"
import { generateSigner, publicKey, transactionBuilder } from "@metaplex-foundation/umi"
import { fromWeb3JsPublicKey, fromWeb3JsInstruction } from "@metaplex-foundation/umi-web3js-adapters"
import { Button, Card, CardBody, CardFooter, CardHeader } from "@nextui-org/react"
import { useNavigate, useOutletContext } from "@remix-run/react"
import { useWallet } from "@solana/wallet-adapter-react"
import { DAS } from "helius-sdk"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { CopyAddress } from "~/components/CopyAddress"
import { NftSelector } from "~/components/NftSelector"
import { FEES_WALLET, adminWallet } from "~/constants"
import { useConvert } from "~/context/convert"
import { useDigitalAssets } from "~/context/digital-assets"
import { usePriorityFees } from "~/context/priority-fees"
import { useUmi } from "~/context/umi"
import { packTx, sendAllTxsWithRetries, displayErrorFromLog } from "~/helpers"
import {
  findMetadataDelegateRecord,
  findProgramConfigPda,
  findProgramDataAddress,
  getTokenAccount,
  getTokenRecordPda,
} from "~/helpers/pdas"
import { ConverterWithPublicKey } from "~/types/types"

type DigitalAssetWithJson = DigitalAsset & {
  json: JsonMetadata
}

export default function Convert() {
  const { removeNft } = useDigitalAssets()
  const convertProgram = useConvert()
  const { feeLevel } = usePriorityFees()
  const converter = useOutletContext<ConverterWithPublicKey>()
  const [toBurn, setToBurn] = useState<DAS.GetAssetResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [pnft, setPnft] = useState<DigitalAssetWithJson | null>(null)
  const wallet = useWallet()
  const navigate = useNavigate()
  const umi = useUmi()

  useEffect(() => {
    if (toBurn) {
      setPnft(null)
    }
  }, [toBurn?.id])

  async function convert() {
    try {
      setLoading(true)
      const newMint = generateSigner(umi)
      if (!converter) {
        throw new Error("No converter loaded")
      }
      if (!toBurn) {
        throw new Error("No NFT selected")
      }
      const promise = Promise.resolve().then(async () => {
        const destinationCollection = await fetchDigitalAsset(
          umi,
          fromWeb3JsPublicKey(converter.account.destinationCollection)
        )
        const sourceCollection = await fetchDigitalAsset(umi, fromWeb3JsPublicKey(converter.account.sourceCollection))
        const toBurnDa = await fetchDigitalAsset(umi, publicKey(toBurn.id))
        const collectionDelegateRecord = findMetadataDelegateRecord(
          umi,
          destinationCollection.publicKey,
          destinationCollection.metadata.updateAuthority,
          fromWeb3JsPublicKey(converter.publicKey)
        )
        const tx = transactionBuilder().add({
          instruction: fromWeb3JsInstruction(
            await convertProgram.methods
              .convert()
              .accounts({
                programConfig: findProgramConfigPda(umi),
                feesWallet: FEES_WALLET,
                converter: converter.publicKey,
                nftMint: toBurnDa.publicKey,
                nftMetadata: toBurnDa.metadata.publicKey,
                updateAuthority: toBurnDa.metadata.updateAuthority,
                masterEdition: toBurnDa.edition?.publicKey!,
                collectionMetadata: sourceCollection.metadata.publicKey,
                nftSource: getTokenAccount(umi, toBurnDa.publicKey, umi.identity.publicKey),
                newMint: newMint.publicKey,
                authority: umi.identity.publicKey,
                newToken: getTokenAccount(umi, newMint.publicKey, umi.identity.publicKey),
                tokenRecord: getTokenRecordPda(umi, newMint.publicKey, umi.identity.publicKey),
                newMetadata: findMetadataPda(umi, { mint: newMint.publicKey })[0],
                newMasterEdition: findMasterEditionPda(umi, { mint: newMint.publicKey })[0],
                newCollectionMint: destinationCollection.publicKey,
                newCollectionMetadata: destinationCollection.metadata.publicKey,
                collectionDelegateRecord,
                newCollectionMasterEdition: destinationCollection.edition!.publicKey,
                metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
                sysvarInstructions: getSysvar("instructions"),
              })
              .instruction()
          ),
          bytesCreatedOnChain: 0,
          signers: [umi.identity, newMint],
        })

        const { chunks, txFee } = await packTx(umi, tx, feeLevel, 500_000)
        const signed = await Promise.all(chunks.map((c) => c.buildAndSign(umi)))
        return await sendAllTxsWithRetries(umi, convertProgram.provider.connection, signed, 1 + (txFee ? 1 : 0))
      })

      toast.promise(promise, {
        loading: "Converting NFT",
        success: "NFT converted successfully!",
        error: (err) => displayErrorFromLog(err, "Error converting NFT"),
      })

      await promise
      const nft = await fetchDigitalAsset(umi, newMint.publicKey)
      const json = await fetchJsonMetadata(umi, nft.metadata.uri)
      setPnft({
        ...nft,
        json,
      })
      removeNft(toBurn.id)
      setToBurn(null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function deleteConverter() {
    try {
      setLoading(true)
      const promise = Promise.resolve().then(async () => {
        const tx = transactionBuilder().add({
          instruction: fromWeb3JsInstruction(
            await convertProgram.methods
              .deleteConverter()
              .accounts({
                converter: converter.publicKey,
                programConfig: findProgramConfigPda(umi),
                programData: findProgramDataAddress(umi),
                program: convertProgram.programId,
              })
              .instruction()
          ),
          bytesCreatedOnChain: 0,
          signers: [umi.identity],
        })
        const { chunks, txFee } = await packTx(umi, tx, feeLevel)
        const signed = await Promise.all(chunks.map((c) => c.buildAndSign(umi)))
        return await sendAllTxsWithRetries(umi, convertProgram.provider.connection, signed, txFee ? 1 : 0)
      })

      toast.promise(promise, {
        loading: "Deleting converter",
        success: "Success!",
        error: (err) => displayErrorFromLog(err, "Error deleting converter"),
      })

      await promise
      navigate("/")
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {wallet.publicKey?.toBase58() === adminWallet && <Button onClick={deleteConverter}>Delete</Button>}
      <div className="flex md:flex-row flex-col lg:gap-20 gap-10 gap-5 mt-5 items-center">
        <Card className="md:w-1/2 w-full p-5">
          <CardHeader>
            <h2 className="font-bold text-2xl">Select NFT to burn</h2>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-3">
              <NftSelector selected={toBurn} setSelected={(da) => setToBurn(da as any)} />
            </div>
          </CardBody>
          <CardFooter>
            <p className="font-bold text-xl text-center w-full">
              {toBurn ? <CopyAddress className="justify-center">{toBurn.id}</CopyAddress> : "Select an NFT"}
            </p>
          </CardFooter>
        </Card>
        <div className="flex flex-col gap-3 items-center justify-center">
          <ArrowRightIcon className="w-20 hidden md:flex" />
          <Button onClick={convert} isDisabled={!toBurn} color="primary" size="lg">
            Convert
          </Button>
          <ArrowDownIcon className="w-20 md:hidden" />
        </div>
        <Card className="md:w-1/2 w-full p-5">
          <CardHeader>
            <h2 className="font-bold text-2xl">Converted pNFT</h2>
          </CardHeader>
          <CardBody>
            <div
              className={`group aspect-square rounded-xl border-3 border-white flex items-center justify-center bg-[image:var(--image-url)] bg-no-repeat bg-contain`}
              style={
                {
                  "--image-url": `url('https://img-cdn.magiceden.dev/rs:fill:600:600:0:0/plain/${pnft?.json?.image}')`,
                } as any
              }
            ></div>
          </CardBody>
          <CardFooter>
            <p className="font-bold text-xl text-center w-full">
              {pnft ? <CopyAddress className="justify-center">{pnft.publicKey}</CopyAddress> : <span>&nbsp;</span>}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
