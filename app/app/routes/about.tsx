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
          <Title /> is a decentralized platform for migrating from legacy asset types (NFT) to newer asset types that
          include features such as royalty enforcement or more concise account design.
        </p>
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
          Currenly <Title /> supports converting NFTs to pNFTs, and either NFTs or pNFTS into the new{" "}
          <Link href="https://developers.metaplex.com/core" target="_blank" rel="noreferrer" className="text-lg">
            Metaplex Core
          </Link>{" "}
          asset class.
        </p>
        <p>
          Support for converting to{" "}
          <Link href="https://nifty-oss.org/" target="_blank" rel="noreferrer" className="text-lg">
            Nifty Assets
          </Link>{" "}
          will be added soon
        </p>

        <p>
          To prevent malicious use, a converter can only be created by the Update Authority wallet, if this is not
          available, the converter will need to be approved by a system admin before the app can be used.
        </p>
        <p>
          When a converter is created, a new Collection asset is minted into the Update Authority wallet to group all
          newly minted pNFTs.{" "}
        </p>
        <p className="font-bold text-primary">
          You will need to give the address of this new Collection NFT to marketplaces in order for the new items to be
          listed as they are minted.
        </p>
      </PanelCard>
    </Page>
  )
}
