import { MPL_TOKEN_AUTH_RULES_PROGRAM_ID } from "@metaplex-foundation/mpl-token-auth-rules"
import { DigitalAsset, TokenStandard, fetchDigitalAsset } from "@metaplex-foundation/mpl-token-metadata"
import { isNone, isSome, publicKey, unwrapOptionRecursively } from "@metaplex-foundation/umi"
import { Button, Input, Link as NextUiLink, Radio, RadioGroup, Switch } from "@nextui-org/react"
import { Link } from "@remix-run/react"
import { useWallet } from "@solana/wallet-adapter-react"
import axios from "axios"

import { DAS } from "helius-sdk"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { CustomRadio } from "~/components/CustomRadio"
import { ErrorMessage } from "~/components/ErrorMessage"
import { ImageUpload } from "~/components/ImageUpload"
import { NftSelectorModal } from "~/components/NftSelector"
import { PanelCard } from "~/components/PanelCard"
import { Popover } from "~/components/Popover"
import { Title } from "~/components/Title"
import { DigitalAssetsProvider } from "~/context/digital-assets"
import { useTheme } from "~/context/theme"
import { useTxs } from "~/context/txs"
import { useUmi } from "~/context/umi"
import { AssetType, CollectionType } from "~/types/types"

export default function Create() {
  const wallet = useWallet()
  const { theme, setTheme } = useTheme()
  const { loading, createConverter, createCoreConverter, createNiftyConverter } = useTxs()
  const [slug, setSlug] = useState("")
  const [name, setName] = useState("")
  const umi = useUmi()
  const [nftPk, setNftPk] = useState<string>("")
  const [slugError, setSlugError] = useState<null | string>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [ruleSet, setRuleSet] = useState("")
  const [ruleSetError, setRuleSetError] = useState<string | null>(null)
  const [bgFile, setBgFile] = useState<File | null>(null)
  const [nftModalOpen, setNftModalOpen] = useState(false)
  const [selectedNft, setSelectedNft] = useState<DAS.GetAssetResponse | null>(null)
  const [nftPkError, setNftPkError] = useState<string | null>(null)
  const [collectionPk, setCollectionPk] = useState("")
  const [collectionError, setCollectionError] = useState<string | null>(null)
  const [collection, setCollection] = useState<DigitalAsset | null>(null)
  const [existingCollection, setExistingCollection] = useState<DigitalAsset | null>(null)
  const [collectionType, setCollectionType] = useState<CollectionType>("existing")
  const [assetType, setAssetType] = useState<AssetType>(AssetType.NIFTY)

  async function create() {
    if (!selectedNft) {
      toast.error("Select an NFT to set up the converter")
      return
    }
    if (assetType === AssetType.PNFT) {
      await createConverter({
        selectedNft,
        collectionType,
        name,
        slug,
        logoFile,
        bgFile,
        collection,
        existingCollection,
        ruleSet: ruleSet ? publicKey(ruleSet) : null,
      })
    } else if (assetType === AssetType.CORE) {
      console.log("creating core converter")
      await createCoreConverter({
        selectedNft,
        name,
        slug,
        logoFile,
        bgFile,
        existingCollection,
      })
    } else if (assetType === AssetType.NIFTY) {
      console.log("creating core converter")
      await createNiftyConverter({
        selectedNft,
        name,
        slug,
        logoFile,
        bgFile,
        existingCollection,
      })
    }
  }

  useEffect(() => {
    const logo = logoFile ? URL.createObjectURL(logoFile) : null
    const bg = bgFile ? URL.createObjectURL(bgFile) : null
    const theme = {
      logo,
      bg,
    }
    setTheme(theme)
  }, [logoFile, bgFile])

  useEffect(() => {
    if (!selectedNft) {
      setNftPk("")
      return
    }
    setNftPk(selectedNft.id)
  }, [selectedNft])

  useEffect(() => {
    if (slug.length > 50) {
      setSlugError("Max 50 characters")
    } else if (!/^(?:[_a-z0-9]+)*$/.test(slug)) {
      setSlugError("Slug can only contain lower case letters, numbers and undercores")
    } else {
      setSlugError(null)
    }
  }, [slug])

  useEffect(() => {
    if (!nftPk) {
      setSelectedNft(null)
      setNftPkError(null)
      setExistingCollection(null)
      return
    }
    ;(async () => {
      try {
        const nftPubkey = publicKey(nftPk)
        const da = await fetchDigitalAsset(umi, nftPubkey)

        const isCollection = isSome(da.metadata.collectionDetails)
        if (isCollection) {
          setExistingCollection(da)
          setCollectionType("clone")
          const {
            data: { digitalAsset },
          } = await axios.get<{ digitalAsset: DAS.GetAssetResponse }>(`/api/get-da-for-collection/${nftPk}`)
          setSelectedNft(digitalAsset)
          setNftPkError(null)
          return
        }

        const collection = unwrapOptionRecursively(da.metadata.collection)
        if (collection?.verified) {
          const collectionDa = await fetchDigitalAsset(umi, collection.key)
          if (collectionDa.metadata.updateAuthority === wallet.publicKey?.toBase58()) {
            setCollectionType("existing")
          } else {
            setCollectionType("clone")
          }
          setExistingCollection(collectionDa)
          setName(collectionDa.metadata.name)
        } else {
          setCollectionType("new")
          setExistingCollection(null)
        }
        const {
          data: { digitalAsset },
        } = await axios.get<{ digitalAsset: DAS.GetAssetResponse }>(`/api/get-nft/${nftPk}`)
        setSelectedNft(digitalAsset)
        setNftPkError(null)
      } catch (err: any) {
        if (err.message.includes("The provided public key is invalid")) {
          setNftPkError("Invalid public key")
        } else if (err.message.includes("The account of type [Metadata] was not found at the provided address")) {
          setNftPkError("This account is not an NFT")
        } else {
          setNftPkError(err.message || "Invalid NFT")
        }
        setExistingCollection(null)
      }
    })()
  }, [nftPk])

  useEffect(() => {
    if (!collectionPk) {
      setCollection(null)
      setCollectionError(null)
      return
    }
    ;(async () => {
      try {
        const collectionPublicKey = publicKey(collectionPk)
        const da = await fetchDigitalAsset(umi, collectionPublicKey)
        if (isNone(da.metadata.collectionDetails)) {
          throw new Error("This address is not a Metaplex Certified Collection")
        }
        if (da.metadata.updateAuthority !== wallet.publicKey?.toBase58()) {
          throw new Error("You must be update authority for the new collection")
        }

        const collectionDetails = unwrapOptionRecursively(da.metadata.collectionDetails)
        if (collectionDetails.__kind === "V1" && collectionDetails.size > 0n) {
          throw new Error("This collection already has items, please create a new collection")
        }

        setCollectionError(null)
        setCollection(da)
      } catch (err: any) {
        if (err.message.includes("The provided public key is invalid")) {
          setCollectionError("Invalid public key")
        } else if (err.message.includes("The account of type [Metadata] was not found at the provided address")) {
          setCollectionError("This account is not an NFT")
        } else {
          setCollectionError(err.message || "Invalid collection")
        }
      }
    })()
  }, [collectionPk])

  useEffect(() => {
    if (!ruleSet) {
      setRuleSetError(null)
      return
    }
    ;(async () => {
      try {
        const ruleSetPk = publicKey(ruleSet)
        const acc = await umi.rpc.getAccount(ruleSetPk)
        if (!acc.exists) {
          throw new Error("Account not found")
        }
        if (acc.owner !== MPL_TOKEN_AUTH_RULES_PROGRAM_ID) {
          throw new Error("Invalid ruleset account")
        }
        setRuleSetError(null)
      } catch (err: any) {
        if (err.message.includes("The provided public key is invalid")) {
          setRuleSetError("Invalid public key")
        } else {
          setRuleSetError(err.message || "Invalid ruleset")
        }
      }
    })()
  }, [ruleSet])

  useEffect(() => {
    setSlug(name.replaceAll(" ", "_").replaceAll("-", "_").replaceAll("__", "_").toLowerCase())
  }, [name])

  function clear() {
    setName("")
    setSlug("")
    setBgFile(null)
    setLogoFile(null)
    setNftPk("")
    setRuleSet("")
  }

  if (!wallet.publicKey) {
    return <ErrorMessage title="Wallet disconnected" />
  }

  const isDirty = name || slug || logoFile || bgFile || nftPk || ruleSet
  const canSubmit =
    name &&
    slug &&
    selectedNft &&
    !slugError &&
    (existingCollection || collection) &&
    !collectionError &&
    !ruleSetError &&
    !nftPkError

  return (
    <DigitalAssetsProvider>
      <div className="h-full flex flex-col gap-4 ">
        <Link to=".">
          {theme?.logo ? <img src={theme?.logo} className="h-20" /> : <h3 className="text-3xl">{name}</h3>}
        </Link>
        <PanelCard
          title={
            <span>
              Create <Title app="converter" />
            </span>
          }
          footer={
            <div className="flex gap-3 justify-end w-full">
              <Button color="danger" variant="bordered" onClick={clear} isDisabled={!isDirty}>
                Clear
              </Button>
              <Button color="primary" isDisabled={loading || !canSubmit} onClick={create}>
                Create
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            <Input
              label="Sample NFT"
              value={nftPk}
              onValueChange={setNftPk}
              variant="bordered"
              errorMessage={nftPkError}
              isRequired
              endContent={
                <Button size="sm" onClick={() => setNftModalOpen(true)}>
                  Choose
                </Button>
              }
            />
            <div className="p-3 bg-content2 rounded-xl flex flex-col gap-3">
              <h3 className="text-xl">Project settings</h3>
              <div className="flex sm:flex-row flex-col gap-3">
                <Input
                  autoFocus
                  label="Name"
                  variant="bordered"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-form-type="other"
                  isRequired
                />
                <Input
                  label="Slug"
                  variant="bordered"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  description={`https://convert.xinlabs.io/${slug}`}
                  errorMessage={slugError}
                  data-form-type="other"
                  isRequired
                />
              </div>

              <div className="flex flex-col [@media(min-width:400px)]:flex-row gap-6 w-full mb-3">
                <ImageUpload
                  label="Logo"
                  file={logoFile}
                  setFile={setLogoFile}
                  className="flex-1 bg-current1"
                  onClear={() => setLogoFile(null)}
                />
                <ImageUpload
                  label="Background"
                  file={bgFile}
                  setFile={setBgFile}
                  className="flex-1"
                  onClear={() => setBgFile(null)}
                />
              </div>
            </div>

            {selectedNft && (
              <div className="flex flex-col gap-3 bg-content2 p-3 rounded-xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl">Conversion details</h3>

                  {existingCollection && (
                    <p className="text-base">
                      Existing MCC:{" "}
                      <NextUiLink
                        href={`https://solscan.io/${existingCollection.publicKey}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {existingCollection.metadata.name}
                      </NextUiLink>
                    </p>
                  )}
                </div>
                <RadioGroup
                  label="Output asset type"
                  value={assetType}
                  onValueChange={(val) => setAssetType(val as AssetType)}
                  orientation="horizontal"
                  className="w-full flex"
                >
                  <CustomRadio value={AssetType.NIFTY} className="flex-1">
                    <div className="flex flex-col gap-3 items-center justify-center">
                      <img src="/nifty-dark.png" />
                      <span>Nifty OSS</span>
                    </div>
                  </CustomRadio>
                  <CustomRadio value={AssetType.CORE} className="flex-1">
                    <div className="flex flex-col gap-3 items-center justify-center">
                      <img src="/metaplex.png" />
                      <span>Metaplex Core</span>
                    </div>
                  </CustomRadio>
                  <CustomRadio value={AssetType.PNFT} className="flex-1">
                    Metaplex pNFT
                  </CustomRadio>
                </RadioGroup>

                {assetType === AssetType.CORE && (
                  <p className="text-xs">
                    A new Core collection will be created to group together the newly minted Core assets. The <Title />{" "}
                    program will be an update delegate until the conversion process is concluded.
                  </p>
                )}

                {assetType === AssetType.NIFTY && (
                  <p className="text-xs">
                    A new Nifty group will be created to group together the newly minted Nifty assets. The <Title />{" "}
                    program will be a grouping delegate until the conversion process is concluded.
                  </p>
                )}

                {assetType === AssetType.PNFT && (
                  <p className="text-xs">
                    {existingCollection ? (
                      <p>
                        This is the new collection used to group the minted pNFTs. You can use the same collection,
                        clone the existing MCC, or provide a new collection mint address below.
                        <br />
                        <br />
                        We recommend using the existing MCC where possible, for maximum integration with marketplaces
                        and third party apps.
                      </p>
                    ) : (
                      <span>
                        No existing collection found, You can create a new Metaplex Certified Collection (MCC) using{" "}
                        <NextUiLink
                          href="https://biblio.tech/tools/nft-suite"
                          className="text-tiny"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Biblio.tech
                        </NextUiLink>
                      </span>
                    )}
                  </p>
                )}

                {assetType === AssetType.PNFT && (
                  <RadioGroup
                    label="Collection for converted pNFTs"
                    value={collectionType}
                    onValueChange={(value) => setCollectionType(value as CollectionType)}
                  >
                    <Radio
                      value="existing"
                      isDisabled={
                        !existingCollection ||
                        existingCollection.metadata.updateAuthority !== wallet.publicKey.toBase58()
                      }
                      description={
                        !existingCollection
                          ? "No existing collection"
                          : existingCollection.metadata.updateAuthority !== wallet.publicKey.toBase58() &&
                            "Update authority mismatch"
                      }
                    >
                      Use existing collection
                    </Radio>
                    <Radio
                      value="clone"
                      isDisabled={!existingCollection}
                      description={!existingCollection && "No existing collection"}
                    >
                      Clone into new collection
                    </Radio>
                    <Radio value="new">Provide new collection</Radio>
                  </RadioGroup>
                )}

                <div className="flex gap-3">
                  {collectionType === "new" && (
                    <Input
                      label="New Metaplex Certified Collection"
                      value={collectionPk}
                      onValueChange={setCollectionPk}
                      variant="bordered"
                      errorMessage={collectionError}
                      isRequired={collectionType === "new"}
                      color={collection && !collectionError ? "primary" : "default"}
                      endContent={
                        <Popover
                          title="Metaplex Certified Collection"
                          placement="left"
                          large
                          content={
                            <div className="flex flex-col gap-3">
                              <p>
                                You can create a new Metaplex Certified Collection (MCC) using{" "}
                                <NextUiLink
                                  href="https://biblio.tech/tools/nft-suite"
                                  className="text-tiny"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Biblio.tech
                                </NextUiLink>
                              </p>
                            </div>
                          }
                        />
                      }
                    />
                  )}
                </div>

                {assetType === AssetType.PNFT && (
                  <Input
                    label="Rule set"
                    value={ruleSet}
                    onValueChange={setRuleSet}
                    variant="bordered"
                    errorMessage={ruleSetError}
                    description="Leave blank to use the default Metaplex managed ruleset"
                    endContent={
                      <Popover
                        title="Rule Set"
                        placement="left"
                        large
                        content={
                          <p>
                            Add a custom rule set if you want to define a bespoke allowlist/blocklist to block specific
                            programs or accounts. Leave blank to assign the default Metaplex rule set
                            <br />
                            <br />
                            You can create a new ruleset using{" "}
                            <NextUiLink
                              href="https://royalties.metaplex.com/"
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs"
                            >
                              Metaplex's royalty tool
                            </NextUiLink>
                          </p>
                        }
                      />
                    }
                  />
                )}

                <h3>
                  Cost per asset:{" "}
                  <span className="text-primary font-bold">
                    {[AssetType.CORE, AssetType.NIFTY].includes(assetType) ? "FREE*" : "0.0279 SOL per mint*"}
                  </span>
                </h3>

                {[AssetType.CORE, AssetType.NIFTY].includes(assetType) ? (
                  <p className="text-xs text-primary">
                    * The cost of minting the new asset class is less than the reclaimed rent from burning the legacy
                    item. Holders will pay nothing, and the program will withold the excess rent from burning (
                    {assetType === AssetType.CORE ? "0.00598 SOL" : "0.00683 SOL"}).
                  </p>
                ) : (
                  <p className="text-xs text-primary">
                    * Paid by the holder per burn/mint. This is made up from the increased rent for the new account, a
                    0.01 SOL Metaplex minting fee, plus a platform fee of 0.015 SOL, minus the rent reclaimed from
                    burning the asset
                  </p>
                )}

                <p className="text-xs">
                  This platform fee can be covered by the project, if you wish to pay this fee for your holders then
                  please <NextUiLink href="https://discord.gg/mybaKJtX2B">open a ticket</NextUiLink> in our discord
                  after creating your converter.
                </p>
              </div>
            )}

            <NftSelectorModal
              modalOpen={nftModalOpen}
              setModalOpen={setNftModalOpen}
              setSelected={(nft) => setSelectedNft(nft as any)}
            />
          </div>
        </PanelCard>
      </div>
    </DigitalAssetsProvider>
  )
}
