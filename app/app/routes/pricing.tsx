import { Tab, Tabs } from "@nextui-org/react"
import { Page } from "~/components/Page"
import { PanelCard } from "~/components/PanelCard"
import { Title } from "~/components/Title"
import { AssetType } from "~/types/types"

export default function Pricing() {
  return (
    <Page>
      <PanelCard
        title={
          <span>
            Pricing <Title />
          </span>
        }
      >
        <Tabs>
          <Tab title="Core" value={AssetType.CORE}>
            <p className="text-center text-primary mb-2 font-bold">0.0026 SOL - 0.0064 SOL</p>
            <p className="text-sm">
              The total cost to convert a legacy or pNFT to a Metaplex Core asset depends on the type of item being
              converted, and whether this has already been resized using Metaplex's new Resize instruction.
              <br />
              <br />
              This amount varies from <span className="text-primary font-bold">0.0026 SOL</span> to convert an
              un-resized pNFT, to <span className="text-primary font-bold">0.0064 SOL</span> to convert a resized legacy
              NFT.
              <br />
              <br />
              This is made up from the rent for the new Core asset:{" "}
              <span className="text-primary font-bold">0.0037 SOL</span> including Metaplex's minting fee of{" "}
              <span className="text-primary font-bold whitespace-nowrap">0.0015 SOL</span> and a platform fee of{" "}
              <span className="text-primary font-bold">0.01 SOL</span>.
              <br />
              <br />
              The original asset is burned and the rent reclaimed. This is used to reduce the cost of the new asset.
            </p>
          </Tab>
          <Tab title="Nifty" value={AssetType.NIFTY}>
            <p className="text-center text-primary mb-2 font-bold">0.0017 SOL - 0.0055 SOL</p>
            <p className="text-sm">
              The total cost to convert a legacy or pNFT to a NiftyOSS asset depends on the type of item being
              converted, and whether this has already been resized using Metaplex's new Resize instruction.
              <br />
              <br />
              This amount varies from <span className="text-primary font-bold">0.0017 SOL</span> to convert an
              un-resized pNFT, to <span className="text-primary font-bold">0.0055 SOL</span> to convert a resized legacy
              NFT.
              <br />
              <br />
              This is made up from the rent for the new Nifty asset:{" "}
              <span className="text-primary font-bold">0.0037 SOL</span> and a platform fee of{" "}
              <span className="text-primary font-bold">0.01 SOL</span>.
              <br />
              <br />
              The original asset is burned and the rent reclaimed. This is used to reduce the cost of the new asset.
            </p>
          </Tab>
          <Tab title="pNFT" value={AssetType.PNFT}>
            <p className="text-sm">
              The total cost to convert an NFT to a pNFT is around{" "}
              <span className="text-primary font-bold">0.0279 SOL</span>. This is made up from the following:
              <br />
              <br />
            </p>
            <ul className="list-disc pl-4">
              <li>
                <p className="text-sm">
                  Metaplex fee of <span className="text-primary font-bold">0.01 SOL</span> fee for minting a new NFT.
                </p>
              </li>
              <li>
                <p className="text-sm">
                  The rent from burning the original NFT is used to open accounts for the new pNFT, an additional amount
                  of <span className="text-primary font-bold">0.0029 SOL</span> rent is needed to create a new Token
                  Record account used by pNFTs.
                </p>
              </li>
              <li>
                <p className="text-sm">
                  Platform fee of <span className="text-primary font-bold">0.015 SOL</span> per item converted. This
                  pays for our infrastructure, future development, and ensures a smooth running service.
                </p>
              </li>
            </ul>
          </Tab>
        </Tabs>
      </PanelCard>
    </Page>
  )
}
