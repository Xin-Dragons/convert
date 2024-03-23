import * as anchor from "@coral-xyz/anchor"
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters"
import { json, type LoaderFunction, type MetaFunction } from "@vercel/remix"
import { Link, useLoaderData } from "@remix-run/react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react"
import { useUmi } from "~/context/umi"
import { Card, CardBody } from "@nextui-org/react"
import { getProgramAccounts } from "~/helpers/index.server"
import _ from "lodash"
import { Title } from "~/components/Title"
import { convertProgram } from "~/helpers/convert.server"
import { ConverterWithPublicKey } from "~/types/types"
import { useConvert } from "~/context/convert"
import { publicKey } from "@metaplex-foundation/umi"

export const loader: LoaderFunction = async () => {
  const converters: ConverterWithPublicKey[] = await getProgramAccounts(convertProgram, "converter", undefined, true)
  console.log(converters)

  return json({
    converters: await Promise.all(
      converters
        .filter((r) => r.account.active)
        .map(async (r) => {
          return {
            publicKey: r.publicKey.toBase58(),
            account: await convertProgram.coder.accounts.encode("converter", r.account),
          }
        })
    ),
  })
}

export default function Index() {
  const [loading, setLoading] = useState(false)
  const wallet = useWallet()
  const umi = useUmi()
  const raffleProgram = useConvert()
  const data = useLoaderData<typeof loader>()
  const converters: ConverterWithPublicKey[] = _.orderBy(
    data.converters.map((r: any) => {
      return {
        publicKey: new anchor.web3.PublicKey(r.publicKey),
        account: raffleProgram.coder.accounts.decode("converter", Buffer.from(r.account)),
      }
    })
  )

  return (
    <div className="container m-x-auto h-full">
      <div className="grid gap-6 lg:grid-cols-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:gid-cols-5">
        {converters.map((converter: ConverterWithPublicKey) => (
          <Converter converter={converter} />
        ))}
      </div>
    </div>
  )
}

function Converter({ converter }: { converter: ConverterWithPublicKey }) {
  const logo = converter.account.logo !== "undefined?ext=undefined" && `https://arweave.net/${converter.account.logo}`

  return (
    <Link to={`/${converter.account.slug}`}>
      <Card className="h-40">
        {logo ? (
          <div className="h-40 flex items-center justify-center">
            <img src={logo} className="p-10 max-h-full max-w-full" />
          </div>
        ) : (
          <CardBody className="flex items-center justify-center">{converter.account.name}</CardBody>
        )}
      </Card>
    </Link>
  )
}
