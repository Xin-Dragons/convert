import * as anchor from "@coral-xyz/anchor"
import { ArrowDownIcon, ArrowRightIcon } from "@heroicons/react/24/outline"
import {
  fetchDigitalAsset,
  DigitalAsset,
  JsonMetadata,
  fetchJsonMetadata,
} from "@metaplex-foundation/mpl-token-metadata"
import { publicKey } from "@metaplex-foundation/umi"
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react"
import { useNavigate, useOutletContext } from "@remix-run/react"
import { useWallet } from "@solana/wallet-adapter-react"
import { DAS } from "helius-sdk"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { CopyAddress } from "~/components/CopyAddress"
import { ErrorMessage } from "~/components/ErrorMessage"
import { NftSelector } from "~/components/NftSelector"
import { adminWallet } from "~/constants"
import { useConvert } from "~/context/convert"
import { useDigitalAssets } from "~/context/digital-assets"
import { usePriorityFees } from "~/context/priority-fees"
import { useTxs } from "~/context/txs"
import { useUmi } from "~/context/umi"
import { findConverterPda } from "~/helpers/pdas"
import { ConverterWithPublicKey } from "~/types/types"

type DigitalAssetWithJson = DigitalAsset & {
  json: JsonMetadata
}

export default function Convert() {
  const { loading, convert, deleteConverter, approve } = useTxs()
  const [converter, setConverter] = useState(useOutletContext<ConverterWithPublicKey>())
  const [toBurn, setToBurn] = useState<DAS.GetAssetResponse | null>(null)
  const [pnft, setPnft] = useState<DigitalAssetWithJson | null>(null)
  const [collectionIdentifier, setCollectionIdentifier] = useState("")
  const [collectionIdentifierError, setCollectionIdentifierError] = useState<string | null>(null)
  const program = useConvert()
  const wallet = useWallet()
  const umi = useUmi()

  useEffect(() => {
    async function syncConverter() {
      const acc = await program.account.converter.fetch(converter.publicKey)
      setConverter({
        publicKey: converter.publicKey,
        account: acc,
      })
    }
    const id = program.provider.connection.onAccountChange(converter.publicKey, syncConverter)
    return () => {
      program.provider.connection.removeAccountChangeListener(id)
    }
  }, [converter.publicKey.toBase58()])

  useEffect(() => {
    if (!collectionIdentifier) {
      setCollectionIdentifierError(null)
      return
    }
    try {
      const pk = publicKey(collectionIdentifier)
      const matches = findConverterPda(umi, pk) === converter.publicKey.toBase58()
      if (matches) {
        setCollectionIdentifierError(null)
      } else {
        setCollectionIdentifierError("Invalid collection identifier")
      }
    } catch {
      setCollectionIdentifierError("Invalid collection identifier")
    }
  }, [collectionIdentifier])

  useEffect(() => {
    if (toBurn) {
      setPnft(null)
    }
  }, [toBurn?.id])

  async function convertNft() {
    if (!toBurn) {
      toast.error("Select an NFT to convert")
      return
    }
    const newMint = await convert(converter, toBurn)
    if (newMint) {
      const nft = await fetchDigitalAsset(umi, newMint)
      const json = await fetchJsonMetadata(umi, nft.metadata.uri)
      setPnft({
        ...nft,
        json,
      })
      setToBurn(null)
    }
  }

  async function doApprove() {
    try {
      if (umi.identity.publicKey !== adminWallet) {
        throw new Error("only system admin can approve a converter")
      }
      if (!collectionIdentifier) {
        throw new Error("Collection identifier required")
      }
      await approve(converter, collectionIdentifier)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (
    converter.account.sourceCollection.equals(anchor.web3.PublicKey.default) &&
    ![adminWallet, converter.account.authority.toBase58()].includes(wallet.publicKey?.toBase58()!)
  ) {
    return <ErrorMessage title="Not found" content="No active converter found at this URL" />
  }

  return (
    <div>
      <div className="flex md:flex-row flex-col lg:gap-20 gap-10 gap-5 mt-5 items-center">
        <Card className="md:w-1/2 w-full p-5">
          <CardHeader>
            <div className="flex justify-between items-center w-full gap-3">
              <h2 className="font-bold text-2xl">Select NFT to burn</h2>
              <p>
                <span className="font-bold uppercase text-xs">Source collection</span>
                <CopyAddress className="justify-end">{converter.account.sourceCollection.toBase58()}</CopyAddress>
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-3">
              <NftSelector selected={toBurn} setSelected={(da) => setToBurn(da as any)} />
            </div>
          </CardBody>
          <CardFooter>
            <p className="font-bold text-xl text-center w-full">
              <span>{toBurn?.content?.metadata.name}</span>
              {toBurn ? <CopyAddress className="justify-center">{toBurn.id}</CopyAddress> : "Select an NFT"}
            </p>
          </CardFooter>
        </Card>
        <div className="flex flex-col gap-3 items-center justify-center">
          <ArrowRightIcon className="w-20 hidden md:flex" />
          <Button onClick={convertNft} isDisabled={!toBurn} color="primary" size="lg">
            Convert
          </Button>
          <ArrowDownIcon className="w-20 md:hidden" />
        </div>
        <Card className="md:w-1/2 w-full p-5">
          <CardHeader>
            <div className="flex justify-between items-center w-full gap-3">
              <h2 className="font-bold text-2xl">Converted pNFT</h2>
              <p className="text-right">
                <span className="font-bold uppercase text-xs text-right">Destination collection</span>
                <CopyAddress className="justify-end">{converter.account.destinationCollection.toBase58()}</CopyAddress>
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <div
              className={`group aspect-square rounded-xl border-3 border-white flex items-center justify-center bg-[image:var(--image-url)] bg-no-repeat bg-contain`}
              style={
                {
                  "--image-url": `url('https://img-cdn.magiceden.dev/rs:fill:600:600:0:0/plain/${pnft?.json?.image}')`,
                } as any
              }
            >
              {pnft && (
                <Chip className="absolute top-8 right-8" color="primary">
                  NFT
                </Chip>
              )}
            </div>
          </CardBody>
          <CardFooter>
            <p className="font-bold text-xl text-center w-full">
              <span>{pnft ? pnft.json.name : <span>&nbsp;</span>}</span>
              {pnft ? <CopyAddress className="justify-center">{pnft.publicKey}</CopyAddress> : <span>&nbsp;</span>}
            </p>
          </CardFooter>
        </Card>
        <Modal
          isOpen={converter.account.sourceCollection.toBase58() === anchor.web3.PublicKey.default.toBase58()}
          className="main-theme text-foreground"
          isDismissable={false}
          classNames={{
            closeButton: "hidden",
          }}
          size="xl"
        >
          <ModalContent>
            <ModalHeader>
              <h2 className="text-primary uppercase text-xl text-center w-full">Approval needed</h2>
            </ModalHeader>
            <ModalBody>
              {wallet.publicKey?.toBase58() === adminWallet ? (
                <Input
                  label="Collection identifier"
                  value={collectionIdentifier}
                  onValueChange={setCollectionIdentifier}
                  errorMessage={collectionIdentifierError}
                />
              ) : (
                <p className="text-center">
                  This converter needs to be approved by a system admin, as the update authority of the new collection
                  does not match the existing collection.
                  <br />
                  <br />
                  Please open a ticket in the{" "}
                  <Link href="https://discord.gg/qfRFjDbcu7" target="_blank" rel="noreferrer">
                    Xin Dragons discord
                  </Link>{" "}
                  to enable the app
                </p>
              )}
            </ModalBody>
            <ModalFooter>
              <div className="w-full flex justify-between">
                <Button color="danger" onClick={() => deleteConverter(converter)}>
                  Delete converter
                </Button>
                {wallet.publicKey?.toBase58() === adminWallet && (
                  <Button onClick={doApprove} color="primary">
                    Approve
                  </Button>
                )}
              </div>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  )
}
