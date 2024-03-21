import { ActionFunction, json } from "@vercel/remix"
import { DAS } from "helius-sdk"
import { filter } from "lodash"
import { getDigitalAssetsForWallet } from "~/helpers/helius.server"

export const action: ActionFunction = async ({ request, params }) => {
  const { collection } = await request.json()
  const { wallet } = params
  const digitalAssets = await getDigitalAssetsForWallet(wallet!)

  return json({
    digitalAssets: filter(
      digitalAssets,
      (da: DAS.GetAssetResponse) =>
        !collection || da.grouping?.find((g) => g.group_key === "collection" && g.group_value === collection)
    ),
  })
}
