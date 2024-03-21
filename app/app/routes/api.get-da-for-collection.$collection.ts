import { LoaderFunction, json } from "@vercel/remix"
import { getDaForCollection } from "~/helpers/helius.server"

export const loader: LoaderFunction = async ({ params }) => {
  const { collection } = params
  const digitalAsset = await getDaForCollection(collection!)

  return json({
    digitalAsset,
  })
}
