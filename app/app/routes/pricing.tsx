import { Card, CardBody, CardHeader } from "@nextui-org/react"
import { Page } from "~/components/Page"
import { PanelCard } from "~/components/PanelCard"
import { Title } from "~/components/Title"

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
        <p>
          The total cost to convert an NFT to a pNFT is around <span className="text-primary font-bold">0.027 SOL</span>
          . This is made up from the following:
        </p>
        <ul className="list-disc pl-4">
          <li>
            <p>
              Metaplex fee of <span className="text-primary font-bold">0.01 SOL</span> fee for minting a new NFT.
            </p>
          </li>
          <li>
            <p>
              The rent from burning the original NFT is used to open accounts for the new pNFT, an additional amount of{" "}
              <span className="text-primary font-bold">0.002 SOL</span> rent is needed to create a new Token Record
              account used by pNFTs.
            </p>
          </li>
          <li>
            <p>
              Xinlabs charge a service fee of <span className="text-primary font-bold">0.015 SOL</span> per item
              converted. This pays for our infrastructure, future development, and ensures a smooth running service!
            </p>
          </li>
        </ul>
      </PanelCard>
    </Page>
  )
}
