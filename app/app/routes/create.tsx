import { MPL_TOKEN_AUTH_RULES_PROGRAM_ID } from "@metaplex-foundation/mpl-token-auth-rules"
import {
  DigitalAsset,
  MPL_TOKEN_METADATA_PROGRAM_ID,
  TokenStandard,
  fetchDigitalAsset,
  findMetadataPda,
} from "@metaplex-foundation/mpl-token-metadata"
import { getSysvar, setComputeUnitPrice } from "@metaplex-foundation/mpl-toolbox"
import {
  createGenericFile,
  createGenericFileFromBrowserFile,
  generateSigner,
  isNone,
  publicKey,
  transactionBuilder,
  unwrapOptionRecursively,
} from "@metaplex-foundation/umi"
import { fromWeb3JsInstruction } from "@metaplex-foundation/umi-web3js-adapters"
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Image,
  Input,
  Link as NextUiLink,
  Switch,
} from "@nextui-org/react"
import { Link, useNavigate } from "@remix-run/react"
import { useWallet } from "@solana/wallet-adapter-react"
import axios from "axios"
import base58 from "bs58"
import { DAS } from "helius-sdk"
import { compact, debounce } from "lodash"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { ErrorMessage } from "~/components/ErrorMessage"
import { ImageUpload } from "~/components/ImageUpload"
import { PanelCard } from "~/components/PanelCard"
import { Popover } from "~/components/Popover"
import { Title } from "~/components/Title"
import { useConvert } from "~/context/convert"
import { usePriorityFees } from "~/context/priority-fees"
import { useTheme } from "~/context/theme"
import { useUmi } from "~/context/umi"
import {
  displayErrorFromLog,
  getCloneCollectionInstruction,
  packTx,
  sendAllTxsWithRetries,
  sleep,
  uploadFiles,
} from "~/helpers"

import { getPriorityFeesForTx } from "~/helpers/helius"
import { findConverterPda, findMetadataDelegateRecord, findProgramConfigPda } from "~/helpers/pdas"

export default function Create() {
  const wallet = useWallet()
  const { feeLevel } = usePriorityFees()
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [slug, setSlug] = useState("")
  const [name, setName] = useState("")
  const umi = useUmi()
  const program = useConvert()
  const [collectionPk, setCollectionPk] = useState<string>("")
  const [collection, setCollection] = useState<DigitalAsset | null>(null)
  const [collectionError, setCollectionError] = useState<string | null>(null)
  const [slugError, setSlugError] = useState<null | string>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [ruleSet, setRuleSet] = useState("")
  const [ruleSetError, setRuleSetError] = useState<string | null>(null)
  const [bgFile, setBgFile] = useState<File | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const logo = logoFile ? URL.createObjectURL(logoFile) : null
    const bg = bgFile ? URL.createObjectURL(bgFile) : null
    const theme = {
      logo,
      bg,
    }
    setTheme(theme)
  }, [logoFile, bgFile])

  async function createConverter() {
    try {
      setLoading(true)
      if (!collection) {
        throw new Error("Select a collection to convert")
      }
      const converter = findConverterPda(umi, collection.publicKey)

      const promise = Promise.resolve().then(async () => {
        let logo = null
        let bg = null
        if (logoFile || bgFile) {
          const uploadPromise = uploadFiles(umi, logoFile, bgFile)

          toast.promise(uploadPromise, {
            loading: "Uploading assets",
            success: "Uploaded successfully",
            error: "Error uploading files",
          })

          const res = await uploadPromise
          logo = res.logo
          bg = res.bg
        }

        const sourceCollection = await fetchDigitalAsset(umi, collection.publicKey)
        const destinationCollection = generateSigner(umi)

        const collectionDelegateRecord = findMetadataDelegateRecord(
          umi,
          destinationCollection.publicKey,
          umi.identity.publicKey,
          converter
        )

        let tx = transactionBuilder()
          .add(getCloneCollectionInstruction(umi, sourceCollection, destinationCollection))
          .add({
            instruction: fromWeb3JsInstruction(
              await program.methods
                .init(name, slug, logo, bg)
                .accounts({
                  programConfig: findProgramConfigPda(umi),
                  converter,
                  sourceCollectionMint: sourceCollection.publicKey,
                  sourceCollectionMetadata: sourceCollection.metadata.publicKey,
                  destinationCollectionMint: destinationCollection.publicKey,
                  destinationCollectionMetadata: findMetadataPda(umi, { mint: destinationCollection.publicKey })[0],
                  collectionDelegateRecord,
                  ruleSet: ruleSet || null,
                  tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
                  sysvarInstructions: getSysvar("instructions"),
                  authorizationRulesProgram: MPL_TOKEN_AUTH_RULES_PROGRAM_ID,
                  authorizationRules: null,
                })
                .instruction()
            ),
            bytesCreatedOnChain:
              8 + 32 + (4 + 50) + (4 + 50) + 32 + 32 + 1 + (1 + 4 + 52) + (1 + 4 + 52) + (1 + 4 + 50) + 1,
            signers: [umi.identity],
          })

        const { chunks, txFee } = await packTx(umi, tx, feeLevel)
        const signed = await Promise.all(chunks.map((c) => c.buildAndSign(umi)))
        return await sendAllTxsWithRetries(umi, program.provider.connection, signed, 1 + (txFee ? 1 : 0))
      })

      toast.promise(promise, {
        loading: "Creating new // CONVERT app",
        success: "// CONVERT created successfully",
        error: (err) => displayErrorFromLog(err, "Error creating // CONVERT app"),
      })

      await promise
      navigate(`/${slug}`)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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
          throw new Error("Only the update authority can set up a converter")
        }
        const {
          data: { digitalAsset },
        } = await axios.get<{ digitalAsset: DAS.GetAssetResponse }>(`/api/get-da-for-collection/${collectionPk}`)
        const sampleDa = await fetchDigitalAsset(umi, publicKey(digitalAsset.id))
        const tokenStandard = unwrapOptionRecursively(sampleDa.metadata.tokenStandard)
        // if (tokenStandard !== null && tokenStandard !== TokenStandard.NonFungible) {
        //   throw new Error("Only legacy NFTs can be converted")
        // }
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
    setCollectionPk("")
    setCollection(null)
    setRuleSet("")
  }

  if (!wallet.publicKey) {
    return <ErrorMessage title="Wallet disconnected" />
  }

  const isDirty = name || slug || logoFile || bgFile || collection || ruleSet
  const canSubmit = name && slug && collection && !slugError && !collectionError && (!ruleSet || !ruleSetError)

  return (
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
            <Button color="primary" isDisabled={loading || !canSubmit} onClick={createConverter}>
              Create //CONVERT
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex sm:flex-row flex-col gap-3">
            <Input
              autoFocus
              label="Name"
              variant="bordered"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-form-type="other"
            />
            <Input
              label="Slug"
              variant="bordered"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              description={`https://convert.xinlabs.io/${slug}`}
              errorMessage={slugError}
              data-form-type="other"
            />
          </div>

          <Input
            label="Metaplex Certified Collection"
            value={collectionPk}
            onValueChange={setCollectionPk}
            variant="bordered"
            errorMessage={collectionError}
            endContent={
              <Popover
                title="Metaplex Certified Collection"
                placement="left"
                large
                content={
                  <div className="flex flex-col gap-3">
                    <p>This can be found by looking at the NFT on Solscan and checking the "Metadata" tab</p>
                    <Image src={"/mcc.png"} />
                    <p>
                      If your collection doesn't have a Metaplex Certified Collection (MCC) you can add one using{" "}
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
                    Add a custom rule set if you want to define a bespoke allowlist/blocklist to block specific programs
                    or accounts. Leave blank to assign the default Metaplex rule set
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

          <div className="flex flex-col [@media(min-width:400px)]:flex-row gap-6 w-full mb-3">
            <ImageUpload
              label="Logo"
              file={logoFile}
              setFile={setLogoFile}
              className="flex-1"
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
      </PanelCard>
    </div>
  )
}
