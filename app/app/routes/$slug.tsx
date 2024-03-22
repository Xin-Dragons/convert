import * as anchor from "@coral-xyz/anchor"

import { LoaderFunction, MetaFunction, json } from "@vercel/remix"
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react"
import { useWallet } from "@solana/wallet-adapter-react"
import { displayErrorFromLog, getConverterFromSlug, packTx, sendAllTxsWithRetries } from "~/helpers"
import { useTheme } from "~/context/theme"
import { useEffect, useState } from "react"
import { usePriorityFees } from "~/context/priority-fees"

import { useUmi } from "~/context/umi"
import { ConverterWithPublicKey, Theme } from "~/types/types"
import { convertProgram } from "~/helpers/convert.server"
import { useConvert } from "~/context/convert"
import { generateSigner, publicKey, transactionBuilder } from "@metaplex-foundation/umi"
import { fromWeb3JsInstruction, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters"
import {
  MPL_TOKEN_METADATA_PROGRAM_ID,
  fetchDigitalAsset,
  findMasterEditionPda,
  findMetadataPda,
} from "@metaplex-foundation/mpl-token-metadata"
import { DAS } from "helius-sdk"
import { findMetadataDelegateRecord, getTokenAccount, getTokenRecordPda } from "~/helpers/pdas"
import { getSysvar } from "@metaplex-foundation/mpl-toolbox"
import toast from "react-hot-toast"
import { NftSelector } from "~/components/NftSelector"
import { DigitalAssetsProvider } from "~/context/digital-assets"
import { Switch } from "@nextui-org/react"
import { adminWallet } from "~/constants"
import { Popover } from "~/components/Popover"

export const meta: MetaFunction = ({ data }: { data: any }) => {
  return [{ title: `${data.name ? data.name + " " : ""} // RAFFLE` }]
}

export const loader: LoaderFunction = async ({ params }) => {
  const { slug } = params
  if (slug === "all") {
    return json({
      all: true,
    })
  }
  const converter: ConverterWithPublicKey = await getConverterFromSlug(slug as string)
  console.log({ converter })

  const encoded = await convertProgram.coder.accounts.encode("converter", converter?.account)

  const theme: Theme = {
    logo:
      (converter.account.logo &&
        converter.account.logo !== "undefined?ext=undefined" &&
        `https://arweave.net/${converter.account.logo}`) ||
      undefined,
    bg:
      (converter.account.bg &&
        converter.account.bg !== "undefined?ext=undefined" &&
        `https://arweave.net/${converter.account.bg}`) ||
      undefined,
  }

  return json({
    converter: {
      publicKey: converter?.publicKey,
      account: encoded,
    },
    name: converter?.account.name,
    theme,
  })
}

export default function Converter() {
  const umi = useUmi()
  const [toBurn, setToBurn] = useState<DAS.GetAssetResponse | null>(null)
  const { feeLevel } = usePriorityFees()
  const [loading, setLoading] = useState(false)
  const { theme } = useTheme()
  const { pathname } = useLocation()
  const data = useLoaderData<typeof loader>()
  const convertProgram = useConvert()
  const [converter, setConverter] = useState<ConverterWithPublicKey>({
    publicKey: new anchor.web3.PublicKey(data.converter.publicKey),
    account: convertProgram.coder.accounts.decode("converter", Buffer.from(data.converter.account)),
  })

  const wallet = useWallet()

  useEffect(() => {
    if (!converter) {
      return
    }
    async function fetchConverter() {
      const acc = await convertProgram.account.converter.fetch(converter!.publicKey)
      setConverter({
        publicKey: converter?.publicKey,
        account: acc,
      })
    }
    const id = convertProgram.provider.connection.onAccountChange(converter.publicKey, fetchConverter)
    return () => {
      convertProgram.provider.connection.removeAccountChangeListener(id)
    }
  }, [converter?.publicKey.toBase58()])

  const isAdmin = wallet.publicKey?.toBase58() === converter?.account.authority.toBase58()

  async function toggleActive(active: boolean) {
    try {
      setLoading(true)
      const promise = Promise.resolve().then(async () => {
        const tx = transactionBuilder().add({
          instruction: fromWeb3JsInstruction(
            await convertProgram.methods
              .toggleActive(active)
              .accounts({
                converter: converter?.publicKey,
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
        loading: active ? "Enabling converter" : "Disabling converter",
        success: "Success",
        error: (err) => displayErrorFromLog(err, "Error disabling converter"),
      })

      await promise
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 ">
      {converter && (
        <div className="flex gap-2 justify-between align-middle">
          <Link to=".">
            {theme?.logo ? (
              <img src={theme?.logo} className="h-20" />
            ) : (
              <h3 className="text-3xl">{converter.account.name}</h3>
            )}
          </Link>

          {(isAdmin || wallet.publicKey?.toBase58() === adminWallet) && (
            <div className="flex items-center gap-1">
              <Switch
                isSelected={converter.account.active}
                onValueChange={(checked) => toggleActive(checked)}
                isDisabled={loading}
              />
              <p>Active</p>
              <Popover
                title={`Converter ${converter.account.active ? "active" : "inactive"}`}
                content={`Flip this toggle to ${converter.account.active ? "disable" : "enable"} converter`}
                placement="left"
              />
            </div>
          )}
        </div>
      )}

      <div className="flex-1">
        <DigitalAssetsProvider collection={converter?.account.sourceCollection.toBase58()}>
          <Outlet context={converter} key={converter?.publicKey.toBase58()} />
        </DigitalAssetsProvider>
      </div>
    </div>
  )
}
