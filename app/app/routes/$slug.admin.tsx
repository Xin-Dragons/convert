import { CollectionV1, fetchCollectionV1 } from "@metaplex-foundation/mpl-core"
import { MPL_TOKEN_AUTH_RULES_PROGRAM_ID } from "@metaplex-foundation/mpl-token-auth-rules"
import { DigitalAsset, fetchDigitalAsset } from "@metaplex-foundation/mpl-token-metadata"
import { publicKey } from "@metaplex-foundation/umi"
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters"
import { Button, Input, Link as NextUiLink } from "@nextui-org/react"
import { useOutletContext } from "@remix-run/react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react"
import { CopyAddress } from "~/components/CopyAddress"
import { ErrorMessage } from "~/components/ErrorMessage"
import { ImageUpload } from "~/components/ImageUpload"
import { PanelCard } from "~/components/PanelCard"
import { Popover } from "~/components/Popover"
import { Title } from "~/components/Title"
import { adminWallet } from "~/constants"
import { useConvert } from "~/context/convert"
import { DigitalAssetsProvider } from "~/context/digital-assets"
import { useTheme } from "~/context/theme"
import { useTxs } from "~/context/txs"
import { useUmi } from "~/context/umi"
import { ConverterWithPublicKey } from "~/types/types"

export default function ConverterAdmin() {
  const { deleteConverter, update, loading } = useTxs()
  const converter = useOutletContext<ConverterWithPublicKey>()
  const wallet = useWallet()
  const { theme } = useTheme()
  const program = useConvert()
  const [name, setName] = useState(converter.account.name)
  const [slug, setSlug] = useState(converter.account.slug)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [collection, setCollection] = useState<DigitalAsset | CollectionV1 | null>(null)
  const [bgFile, setBgFile] = useState<File | null>(null)
  const [ruleSet, setRuleSet] = useState(converter.account.ruleSet?.toBase58())
  const [ruleSetError, setRuleSetError] = useState<string | null>(null)
  const { setTheme } = useTheme()
  const umi = useUmi()

  useEffect(() => {
    ;(async () => {
      if (converter.account.assetType.pnft) {
        const collection = await fetchDigitalAsset(umi, fromWeb3JsPublicKey(converter.account.destinationCollection))
        setCollection(collection)
      } else {
        const collection = await fetchCollectionV1(umi, fromWeb3JsPublicKey(converter.account.destinationCollection))
        setCollection(collection)
      }
    })()
  }, [converter.account.destinationCollection.toBase58()])

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
    if (slug.length > 50) {
      setSlugError("Max 50 characters")
    } else if (!/^(?:[_a-z0-9]+)*$/.test(slug)) {
      setSlugError("Slug can only contain lower case letters, numbers and undercores")
    } else {
      setSlugError(null)
    }
  }, [slug])

  function clear() {
    setName(converter.account.name)
    setSlug(converter.account.slug)
  }

  async function doUpdate() {
    await update(converter, name, logoFile, bgFile, ruleSet)
  }

  useEffect(() => {
    const logo = logoFile ? URL.createObjectURL(logoFile) : null
    const bg = bgFile ? URL.createObjectURL(bgFile) : null
    const theme = {
      logo: logo || (converter.account.logo && `https://arweave.net/${converter.account.logo}`),
      bg: bg || (converter.account.bg && `https://arweave.net/${converter.account.bg}`),
    }
    setTheme(theme)
  }, [logoFile, bgFile])

  const isDirty =
    name !== converter.account.name ||
    slug !== converter.account.slug ||
    logoFile ||
    bgFile ||
    ruleSet !== converter.account.ruleSet?.toBase58()

  const canSubmit = isDirty && !ruleSetError

  if (!wallet.publicKey) {
    return <ErrorMessage title="Wallet disconnected" content="Please connect your wallet to access this page" />
  }

  if (![converter.account.authority.toBase58(), adminWallet].includes(wallet.publicKey.toBase58())) {
    return <ErrorMessage title="Unauthorised" content="Only the converter admin can access this page" />
  }

  return (
    <DigitalAssetsProvider>
      <div className="h-full flex flex-col gap-4 ">
        <PanelCard
          title={
            <span>
              Update <Title app="converter" />
            </span>
          }
          footer={
            <div className="flex gap-3 justify-between w-full">
              <Button color="danger" onClick={() => deleteConverter(converter)}>
                Delete
              </Button>
              <div className="flex gap-3">
                <Button color="danger" variant="bordered" onClick={clear} isDisabled={!isDirty}>
                  Clear
                </Button>
                <Button color="primary" isDisabled={loading || !canSubmit} onClick={doUpdate}>
                  Update
                </Button>
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-3">
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

            {converter.account.assetType.pnft && (
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
          </div>
        </PanelCard>
      </div>
    </DigitalAssetsProvider>
  )
}
