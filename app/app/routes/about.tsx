import { Card, CardBody, CardHeader, Link } from "@nextui-org/react"
import { Page } from "~/components/Page"
import { PanelCard } from "~/components/PanelCard"
import { Title } from "~/components/Title"
import { metadata } from "~/idl/convert.json"

export default function About() {
  return (
    <Page>
      <PanelCard
        title={
          <span>
            About <Title />
          </span>
        }
      >
        <p>
          <Title /> is a decentralized platform for creating NFT to pNFT converters for any collection who did not move
          to royalty enforced pNFTs during the conversion period in 2023.
        </p>
        <p>Holders can burn their existing legacy NFTs and receive identical royalty-enforced pNFTs in their place.</p>
        <p>
          The program address is{" "}
          <Link
            href={`https://solscan.io/account/${metadata.address}`}
            target="_blank"
            rel="noreferrer"
            className="text-lg"
          >
            {metadata.address}
          </Link>{" "}
          and the full open source code can be viewed on{" "}
          <Link href="https://github.com/Xin-Dragons/convert" target="_blank" rel="noreferrer" className="text-lg">
            Github
          </Link>
        </p>
        <p>
          To prevent any malicious use, a converter can only be created by the Update Authority wallet. When a converter
          is created, a new Metaplex Certified Collection NFT is minted into the Update Authority wallet to group all
          newly minted pNFTs.{" "}
        </p>
        <p className="font-bold text-primary">
          You will need to give the address of this new Collection NFT to marketplaces in order for the new items to be
          listed as they are minted.
        </p>
        <p>
          New pNFTs can be minted with the default Metaplex rule set, or a bespoke ruleset if you wish to fine-tune an
          allow/deny list. A custom ruleset can be created using
          <Link href="https://royalties.metaplex.com/" target="_blank" rel="noreferrer" className="text-lg">
            Metaplex's royalty tool
          </Link>
          .
        </p>
      </PanelCard>
    </Page>
  )
}
