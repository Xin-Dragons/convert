import {
  Button,
  Chip,
  CircularProgress,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react"
import { DAS } from "helius-sdk"
import { Dispatch, SetStateAction, useState } from "react"
import { useDigitalAssets } from "~/context/digital-assets"
import { imageCdn } from "~/helpers"

export function NftSelector({
  selected,
  setSelected,
  filter,
}: {
  selected: DAS.GetAssetResponse | null
  setSelected: Dispatch<SetStateAction<DAS.GetAssetResponse>>
  filter?: (asset: DAS.GetAssetResponse) => boolean
}) {
  const [modalOpen, setModalOpen] = useState(false)
  return (
    <div>
      <div
        className={`group aspect-square rounded-xl border-3 border-white flex items-center justify-center bg-[image:var(--image-url)] bg-no-repeat bg-contain`}
        style={
          {
            "--image-url": `url('https://image.solanatracker.io/proxy?url=${selected?.content?.links?.image}')`,
          } as any
        }
      >
        {selected && (
          <Chip className="absolute top-8 right-8" color="warning">
            NFT
          </Chip>
        )}
        <Button
          className={`opacity-${selected ? "0" : "100"} group-hover:opacity-100`}
          onClick={() => setModalOpen(true)}
        >
          {selected ? "Change" : "Select"} NFT
        </Button>
      </div>
      <NftSelectorModal modalOpen={modalOpen} setModalOpen={setModalOpen} setSelected={setSelected} filter={filter} />
    </div>
  )
}

export function NftSelectorModal({
  modalOpen,
  setModalOpen,
  setSelected,
  filter,
  title = "Select an NFT",
}: {
  modalOpen: boolean
  setModalOpen: Dispatch<SetStateAction<boolean>>
  setSelected: Dispatch<SetStateAction<DAS.GetAssetResponse>>
  filter?: (asset: DAS.GetAssetResponse) => boolean
  title?: string
}) {
  return (
    <Modal
      isOpen={modalOpen}
      onOpenChange={(open) => setModalOpen(open)}
      size="5xl"
      className="main-theme text-foreground"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
            <ModalBody>
              <Nfts
                filter={filter}
                onSelect={(da) => {
                  setSelected(da)
                  onClose()
                }}
              />
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Close
              </Button>
              <Button color="primary" onPress={onClose}>
                OK
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

function Nfts({
  onSelect,
  filter = () => true,
}: {
  onSelect: Dispatch<SetStateAction<DAS.GetAssetResponse>>
  filter?: (asset: DAS.GetAssetResponse) => boolean
}) {
  const { digitalAssets, fetching } = useDigitalAssets()

  if (fetching) {
    return (
      <div className="flex flex-col gap-1 justify-center items-center">
        <p className="font-bold">Reading wallet contents</p>
        <CircularProgress />
      </div>
    )
  }

  if (!digitalAssets.length) {
    return (
      <div className="flex flex-col gap-1 justify-center items-center">
        <p className="font-bold">No eligible NFTs found</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-4 grid-rows-3">
      {digitalAssets.filter(filter).map((da) => (
        <div className="aspect-square">
          <img src={imageCdn(da.content?.links?.image!)} className="cursor-pointer" onClick={() => onSelect(da)} />
        </div>
      ))}
    </div>
  )
}
