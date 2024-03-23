import { ActionFunction, json } from "@vercel/remix"
import { DAS } from "helius-sdk"
import { getDigitalAssetsForWallet } from "~/helpers/helius.server"

export const action: ActionFunction = async ({ request, params }) => {
  const { collection, creator } = await request.json()
  const { wallet } = params
  const digitalAssets = await getDigitalAssetsForWallet(wallet!)

  return json({
    digitalAssets: digitalAssets
      .filter(
        (da: DAS.GetAssetResponse) =>
          !collection || da.grouping?.find((g) => g.group_key === "collection" && g.group_value === collection)
      )
      .filter((da: DAS.GetAssetResponse) => !creator || da.creators?.find((c) => c.verified)?.address === creator),
  })
}
