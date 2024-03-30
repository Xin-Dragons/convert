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
            <p>
              The total cost to convert a legacy or pNFT to a Metaplex Core asset is{" "}
              <span className="text-primary font-bold">0 SOL</span>
              <br />
              <br />
              The original asset is burned and the rent reclaimed. This is used to pay for the rent of the new Core
              asset: <span className="text-primary font-bold">0.0037 SOL</span>, including the Metaplex minting fee of{" "}
              <span className="text-primary font-bold whitespace-nowrap">0.0015 SOL</span>
              <br />
              <br />
              The surplus rent from burning the original NFT is witheld by the program to pay for infrastructure, future
              development, and ensure a smooth running service!
            </p>
          </Tab>
          <Tab title="pNFT" value={AssetType.PNFT}>
            <p>
              The total cost to convert an NFT to a pNFT is around{" "}
              <span className="text-primary font-bold">0.0279 SOL</span>. This is made up from the following:
              <br />
              <br />
            </p>
            <ul className="list-disc pl-4">
              <li>
                <p>
                  Metaplex fee of <span className="text-primary font-bold">0.01 SOL</span> fee for minting a new NFT.
                </p>
              </li>
              <li>
                <p>
                  The rent from burning the original NFT is used to open accounts for the new pNFT, an additional amount
                  of <span className="text-primary font-bold">0.0029 SOL</span> rent is needed to create a new Token
                  Record account used by pNFTs.
                </p>
              </li>
              <li>
                <p>
                  Xinlabs charge a service fee of <span className="text-primary font-bold">0.015 SOL</span> per item
                  converted. This pays for our infrastructure, future development, and ensures a smooth running service!
                </p>
              </li>
            </ul>
          </Tab>
        </Tabs>
      </PanelCard>
    </Page>
  )
}
