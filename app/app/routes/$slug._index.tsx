import { ArrowDownIcon, ArrowRightIcon } from "@heroicons/react/24/outline"
import { AssetV1, fetchAssetV1 } from "@metaplex-foundation/mpl-core"
import {
  fetchDigitalAsset,
  DigitalAsset,
  JsonMetadata,
  fetchJsonMetadata,
} from "@metaplex-foundation/mpl-token-metadata"
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react"
import { Asset, ExtensionType, fetchAsset, getExtension } from "@nifty-oss/asset"
import { useOutletContext } from "@remix-run/react"
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
import { useTxs } from "~/context/txs"
import { useUmi } from "~/context/umi"
import { ConverterWithPublicKey } from "~/types/types"

type DigitalAssetWithJson = DigitalAsset & {
  json: JsonMetadata
}

type CoreAssetWithJson = AssetV1 & {
  json: JsonMetadata
}

type WithJson<T> = T & {
  json: JsonMetadata
}

export default function Convert() {
  const { removeNft } = useDigitalAssets()
  const { convert, deleteConverter, toggleApproved, convertCore, convertNifty } = useTxs()
  const [converter, setConverter] = useState(useOutletContext<ConverterWithPublicKey>())
  const [toBurn, setToBurn] = useState<DAS.GetAssetResponse | null>(null)
  const [pnft, setPnft] = useState<DigitalAssetWithJson | null>(null)
  const [coreAsset, setCoreAsset] = useState<WithJson<AssetV1> | null>(null)
  const [niftyAsset, setNiftyAsset] = useState<WithJson<Asset> | null>(null)
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
    if (toBurn) {
      setPnft(null)
    }
  }, [toBurn?.id])

  async function convertNft() {
    if (!toBurn) {
      toast.error("Select an NFT to convert")
      return
    }
    const newMint = converter.account.assetType.pnft
      ? await convert(converter, toBurn)
      : converter.account.assetType.core
      ? await convertCore(converter, toBurn)
      : await convertNifty(converter, toBurn)
    if (newMint) {
      if (converter.account.assetType.pnft) {
        const nft = await fetchDigitalAsset(umi, newMint)
        const json = await fetchJsonMetadata(umi, nft.metadata.uri)
        setPnft({
          ...nft,
          json,
        })
      } else if (converter.account.assetType.core) {
        const coreAsset = await fetchAssetV1(umi, newMint)
        const json = await fetchJsonMetadata(umi, coreAsset.uri)
        setCoreAsset({
          ...coreAsset,
          json,
        })
      } else {
        const niftyAsset = await fetchAsset(umi, newMint)
        const uri = getExtension(niftyAsset, ExtensionType.Metadata)?.uri
        const json = await fetchJsonMetadata(umi, uri)
        setNiftyAsset({
          ...niftyAsset,
          json,
        })
      }
      setToBurn(null)
      removeNft(toBurn.id)
    }
  }

  async function doApprove() {
    try {
      if (umi.identity.publicKey !== adminWallet) {
        throw new Error("only system admin can approve a converter")
      }
      await toggleApproved(converter, true)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (
    !converter.account.approved &&
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
              <h2 className="font-bold text-2xl">Legacy NFT</h2>
              <p>
                <span className="font-bold uppercase text-xs">Source collection</span>
                <CopyAddress className="justify-end">{converter.account.sourceCollection.toBase58()}</CopyAddress>
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-3">
              <NftSelector
                selected={toBurn}
                setSelected={(da) => setToBurn(da as any)}
                filter={(da) => !da.ownership.delegated}
              />
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
              <h2 className="font-bold text-2xl">
                {converter.account.assetType.pnft
                  ? "pNFT"
                  : converter.account.assetType.core
                  ? "Core asset"
                  : "Nifty asset"}
              </h2>
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
                  "--image-url": `url('https://img-cdn.magiceden.dev/rs:fill:600:600:0:0/plain/${
                    (pnft || coreAsset || niftyAsset)?.json.image
                  }')`,
                } as any
              }
            >
              {pnft && (
                <Chip className="absolute top-8 right-8" color="primary" size="lg">
                  pNFT
                </Chip>
              )}
              {coreAsset && (
                <Chip className="absolute top-8 right-8" color="primary" size="lg">
                  CORE
                </Chip>
              )}
              {niftyAsset && (
                <Chip className="absolute top-8 right-8" color="primary" size="lg">
                  NIFTY
                </Chip>
              )}
            </div>
          </CardBody>
          <CardFooter>
            <p className="font-bold text-xl text-center w-full">
              <span>
                {converter.account.assetType.pnft ? (
                  pnft ? (
                    pnft.json.name
                  ) : (
                    <span>&nbsp;</span>
                  )
                ) : coreAsset || niftyAsset ? (
                  (coreAsset || niftyAsset)!.name
                ) : (
                  <span>&nbsp;</span>
                )}
              </span>
              {pnft || coreAsset || niftyAsset ? (
                <CopyAddress className="justify-center">{(pnft || coreAsset || niftyAsset)!.publicKey}</CopyAddress>
              ) : (
                <span>&nbsp;</span>
              )}
            </p>
          </CardFooter>
        </Card>
        <Modal
          isOpen={!converter.account.approved}
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
              {wallet.publicKey?.toBase58() !== adminWallet && (
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
