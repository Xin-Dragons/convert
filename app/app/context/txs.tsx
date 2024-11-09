import { PropsWithChildren, createContext, useContext, useState } from "react"
import { useConvert } from "./convert"
import { fromWeb3JsInstruction, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters"
import { CollectionType, ConverterWithPublicKey } from "~/types/types"
import { UmiProvider, useUmi } from "./umi"
import { ASSET_PROGRAM_ID, fetchAsset } from "@nifty-oss/asset"
import {
  DigitalAsset,
  MPL_TOKEN_METADATA_PROGRAM_ID,
  TokenStandard,
  fetchDigitalAsset,
  fetchJsonMetadata,
  findMasterEditionPda,
  findMetadataPda,
} from "@metaplex-foundation/mpl-token-metadata"
import {
  findConverterPda,
  findMetadataDelegateRecord,
  findProgramConfigPda,
  findProgramDataAddress,
  getTokenAccount,
  getTokenRecordPda,
} from "~/helpers/pdas"
import {
  KeypairSigner,
  PublicKey,
  TransactionBuilder,
  generateSigner,
  publicKey,
  transactionBuilder,
  unwrapOptionRecursively,
} from "@metaplex-foundation/umi"
import { MPL_TOKEN_AUTH_RULES_PROGRAM_ID } from "@metaplex-foundation/mpl-token-auth-rules"
import { SPL_TOKEN_PROGRAM_ID, getSysvar } from "@metaplex-foundation/mpl-toolbox"
import {
  displayErrorFromLog,
  getCloneCollectionInstruction,
  packTx,
  sendAllTxsWithRetries,
  uploadFiles,
} from "~/helpers"
import { usePriorityFees } from "./priority-fees"
import toast from "react-hot-toast"
import { useNavigate } from "@remix-run/react"
import { DAS } from "helius-sdk"
import { FEES_WALLET } from "~/constants"
import { MPL_CORE_PROGRAM_ID, fetchCollectionV1 } from "@metaplex-foundation/mpl-core"
import { useDigitalAssets } from "./digital-assets"
import BN from "bn.js"

const Context = createContext<
  | {
      loading: boolean
      deleteConverter: (converter: ConverterWithPublicKey) => Promise<void>
      convert: (converter: ConverterWithPublicKey, toBurn: DAS.GetAssetResponse) => Promise<PublicKey | undefined>
      convertCore: (converter: ConverterWithPublicKey, toBurn: DAS.GetAssetResponse) => Promise<PublicKey | undefined>
      convertNifty: (converter: ConverterWithPublicKey, toBurn: DAS.GetAssetResponse) => Promise<PublicKey | undefined>
      createConverter: (props: {
        selectedNft: DAS.GetAssetResponse
        collectionType: CollectionType
        collection: DigitalAsset | null
        existingCollection: DigitalAsset | null
        logoFile: File | null
        bgFile: File | null
        name: string
        slug: string
        ruleSet: PublicKey | null
      }) => Promise<void>
      toggleApproved: (converter: ConverterWithPublicKey, approved: boolean) => Promise<void>
      update: (
        converter: ConverterWithPublicKey,
        name: string,
        logoFile: File | null,
        bgFile: File | null,
        ruleSet?: string
      ) => Promise<void>
      createCoreConverter: (props: {
        selectedNft: DAS.GetAssetResponse
        name: string
        slug: string
        logoFile: File | null
        bgFile: File | null
        existingCollection: DigitalAsset | null
      }) => Promise<void>
      createNiftyConverter: (props: {
        selectedNft: DAS.GetAssetResponse
        name: string
        slug: string
        logoFile: File | null
        bgFile: File | null
        existingCollection: DigitalAsset | null
      }) => Promise<void>
    }
  | undefined
>(undefined)

export function TxsProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(false)
  const program = useConvert()
  const umi = useUmi()
  const { feeLevel } = usePriorityFees()
  const navigate = useNavigate()

  async function deleteConverter(converter: ConverterWithPublicKey) {
    try {
      setLoading(true)

      const promise = Promise.resolve().then(async () => {
        let tx: TransactionBuilder = transactionBuilder()
        if (converter.account.assetType.pnft) {
          const collectionMint = fromWeb3JsPublicKey(converter.account.destinationCollection)
          const collection = await fetchDigitalAsset(umi, collectionMint)
          const collectionDelegateRecord = findMetadataDelegateRecord(
            umi,
            collection.publicKey,
            collection?.metadata.updateAuthority,
            fromWeb3JsPublicKey(converter.publicKey)
          )
          const authorizationRules = unwrapOptionRecursively(collection.metadata.programmableConfig)?.ruleSet || null
          const isUa = collection.metadata.updateAuthority === umi.identity.publicKey
          tx = tx.add({
            instruction: fromWeb3JsInstruction(
              await program.methods
                .closeConverter()
                .accounts({
                  converter: converter.publicKey,
                  program: isUa ? null : program.programId,
                  programData: isUa ? null : findProgramDataAddress(umi),
                  programConfig: findProgramConfigPda(umi),
                  collectionMint,
                  collectionMetadata: collection.metadata.publicKey,
                  collectionDelegateRecord,
                  tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
                  authorizationRules,
                  authorizationRulesProgram: authorizationRules ? MPL_TOKEN_AUTH_RULES_PROGRAM_ID : null,
                  sysvarInstructions: getSysvar("instructions"),
                })
                .instruction()
            ),
            bytesCreatedOnChain: 0,
            signers: [umi.identity],
          })
        } else if (converter.account.assetType.core) {
          const isUa = converter.account.authority.toBase58() === umi.identity.publicKey
          tx = tx.add({
            instruction: fromWeb3JsInstruction(
              await program.methods
                .closeCoreConverter()
                .accounts({
                  programConfig: findProgramConfigPda(umi),
                  program: isUa ? null : program.programId,
                  programData: isUa ? null : findProgramDataAddress(umi),
                  converter: converter.publicKey,
                  collection: converter.account.destinationCollection,
                  coreProgram: MPL_CORE_PROGRAM_ID,
                })
                .instruction()
            ),
            bytesCreatedOnChain: 0,
            signers: [umi.identity],
          })
        }

        const { chunks, txFee } = await packTx(umi, tx, feeLevel)
        const signed = await Promise.all(chunks.map((c) => c.buildAndSign(umi)))
        const { successes, errors } = await sendAllTxsWithRetries(
          umi,
          program.provider.connection,
          signed,
          txFee ? 1 : 0
        )
        console.log({ successes, errors })
        return { successes, errors }
      })

      toast.promise(promise, {
        loading: "Deleting converter",
        success: "Deleted successfully",
        error: (err) => displayErrorFromLog(err, "Error deleting converter"),
      })

      await promise

      navigate("/")
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function convert(converter: ConverterWithPublicKey, toBurn: DAS.GetAssetResponse) {
    try {
      setLoading(true)
      const newMint = generateSigner(umi)
      if (!converter) {
        throw new Error("No converter loaded")
      }
      if (!toBurn) {
        throw new Error("No NFT selected")
      }
      const promise = Promise.resolve().then(async () => {
        const destinationCollection = await fetchDigitalAsset(
          umi,
          fromWeb3JsPublicKey(converter.account.destinationCollection)
        )
        const collectionIdentifier = fromWeb3JsPublicKey(converter.account.sourceCollection)
        const sourceCollection = await umi.rpc.getAccount(collectionIdentifier)
        const isCollection = sourceCollection.exists && sourceCollection.owner === SPL_TOKEN_PROGRAM_ID
        const collectionDa = isCollection ? await fetchDigitalAsset(umi, collectionIdentifier) : null

        const toBurnDa = await fetchDigitalAsset(umi, publicKey(toBurn.id))
        const collectionDelegateRecord = findMetadataDelegateRecord(
          umi,
          destinationCollection.publicKey,
          destinationCollection.metadata.updateAuthority,
          fromWeb3JsPublicKey(converter.publicKey)
        )
        const tx = transactionBuilder().add({
          instruction: fromWeb3JsInstruction(
            await program.methods
              .convert()
              .accounts({
                programConfig: findProgramConfigPda(umi),
                feesWallet: FEES_WALLET,
                converter: converter.publicKey,
                nftMint: toBurnDa.publicKey,
                nftMetadata: toBurnDa.metadata.publicKey,
                masterEdition: toBurnDa.edition?.publicKey!,
                collectionMetadata: collectionDa ? collectionDa.metadata.publicKey : null,
                nftSource: getTokenAccount(umi, toBurnDa.publicKey, umi.identity.publicKey),
                newMint: newMint.publicKey,
                newToken: getTokenAccount(umi, newMint.publicKey, umi.identity.publicKey),
                tokenRecord: getTokenRecordPda(umi, newMint.publicKey, umi.identity.publicKey),
                newMetadata: findMetadataPda(umi, { mint: newMint.publicKey })[0],
                newMasterEdition: findMasterEditionPda(umi, { mint: newMint.publicKey })[0],
                newCollectionMint: destinationCollection.publicKey,
                newCollectionMetadata: destinationCollection.metadata.publicKey,
                collectionDelegateRecord,
                newCollectionMasterEdition: destinationCollection.edition!.publicKey,
                metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
                sysvarInstructions: getSysvar("instructions"),
              })
              .instruction()
          ),
          bytesCreatedOnChain: 0,
          signers: [umi.identity, newMint],
        })

        const { chunks, txFee } = await packTx(umi, tx, feeLevel, 500_000)
        const signed = await Promise.all(chunks.map((c) => c.buildAndSign(umi)))
        return await sendAllTxsWithRetries(umi, program.provider.connection, signed, 1 + (txFee ? 1 : 0))
      })

      toast.promise(promise, {
        loading: "Converting NFT",
        success: "NFT converted successfully!",
        error: (err) => displayErrorFromLog(err, "Error converting NFT"),
      })

      await promise

      return newMint.publicKey
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function convertCore(converter: ConverterWithPublicKey, toBurn: DAS.GetAssetResponse) {
    try {
      setLoading(true)
      const newMint = generateSigner(umi)
      if (!converter) {
        throw new Error("No converter loaded")
      }
      if (!toBurn) {
        throw new Error("No NFT selected")
      }
      const promise = Promise.resolve().then(async () => {
        const destinationCollection = await fetchCollectionV1(
          umi,
          fromWeb3JsPublicKey(converter.account.destinationCollection)
        )
        const collectionIdentifier = fromWeb3JsPublicKey(converter.account.sourceCollection)
        const sourceCollection = await umi.rpc.getAccount(collectionIdentifier)
        const isCollection = sourceCollection.exists && sourceCollection.owner === SPL_TOKEN_PROGRAM_ID

        const toBurnDa = await fetchDigitalAsset(umi, publicKey(toBurn.id))

        const isPnft =
          unwrapOptionRecursively(toBurnDa.metadata.tokenStandard) === TokenStandard.ProgrammableNonFungible
        const tokenRecord = isPnft ? getTokenRecordPda(umi, toBurnDa.publicKey, umi.identity.publicKey) : null

        const tx = transactionBuilder().add({
          instruction: fromWeb3JsInstruction(
            await program.methods
              .convertCore()
              .accounts({
                converter: converter.publicKey,
                programConfig: findProgramConfigPda(umi),
                feesWallet: FEES_WALLET,
                nftMint: toBurnDa.publicKey,
                nftSource: getTokenAccount(umi, toBurnDa.publicKey, umi.identity.publicKey),
                nftMetadata: toBurnDa.metadata.publicKey,
                masterEdition: toBurnDa.edition?.publicKey,
                collectionMetadata: isCollection ? findMetadataPda(umi, { mint: collectionIdentifier })[0] : null,
                newMint: newMint.publicKey,
                updateAuthority: converter.account.authority,
                newCollectionMint: destinationCollection.publicKey,
                metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
                tokenRecord,
                sysvarInstructions: getSysvar("instructions"),
                coreProgram: MPL_CORE_PROGRAM_ID,
              })
              .instruction()
          ),
          bytesCreatedOnChain: 0,
          signers: [umi.identity, newMint],
        })

        const { chunks, txFee } = await packTx(umi, tx, feeLevel, 500_000)
        const signed = await Promise.all(chunks.map((c) => c.buildAndSign(umi)))
        return await sendAllTxsWithRetries(umi, program.provider.connection, signed, 1 + (txFee ? 1 : 0))
      })

      toast.promise(promise, {
        loading: "Converting NFT",
        success: "NFT converted successfully!",
        error: (err) => displayErrorFromLog(err, "Error converting NFT"),
      })

      await promise

      return newMint.publicKey
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function convertNifty(converter: ConverterWithPublicKey, toBurn: DAS.GetAssetResponse) {
    try {
      setLoading(true)
      const newMint = generateSigner(umi)
      if (!converter) {
        throw new Error("No converter loaded")
      }
      if (!toBurn) {
        throw new Error("No NFT selected")
      }
      const promise = Promise.resolve().then(async () => {
        const destinationCollection = await fetchAsset(
          umi,
          fromWeb3JsPublicKey(converter.account.destinationCollection)
        )
        const collectionIdentifier = fromWeb3JsPublicKey(converter.account.sourceCollection)
        const sourceCollection = await umi.rpc.getAccount(collectionIdentifier)
        const isCollection = sourceCollection.exists && sourceCollection.owner === SPL_TOKEN_PROGRAM_ID

        const toBurnDa = await fetchDigitalAsset(umi, publicKey(toBurn.id))

        const isPnft =
          unwrapOptionRecursively(toBurnDa.metadata.tokenStandard) === TokenStandard.ProgrammableNonFungible
        const tokenRecord = isPnft ? getTokenRecordPda(umi, toBurnDa.publicKey, umi.identity.publicKey) : null

        const tx = transactionBuilder().add({
          instruction: fromWeb3JsInstruction(
            await program.methods
              .convertNifty()
              .accounts({
                converter: converter.publicKey,
                feesWallet: FEES_WALLET,
                nftMint: toBurnDa.publicKey,
                nftSource: getTokenAccount(umi, toBurnDa.publicKey, umi.identity.publicKey),
                nftMetadata: toBurnDa.metadata.publicKey,
                masterEdition: toBurnDa.edition?.publicKey,
                collectionMetadata: isCollection ? findMetadataPda(umi, { mint: collectionIdentifier })[0] : null,
                newMint: newMint.publicKey,
                updateAuthority: converter.account.authority,
                newCollectionMint: destinationCollection.publicKey,
                metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
                tokenRecord,
                sysvarInstructions: getSysvar("instructions"),
                niftyProgram: ASSET_PROGRAM_ID,
              })
              .instruction()
          ),
          bytesCreatedOnChain: 0,
          signers: [umi.identity, newMint],
        })

        const { chunks, txFee } = await packTx(umi, tx, feeLevel, 500_000)
        const signed = await Promise.all(chunks.map((c) => c.buildAndSign(umi)))
        return await sendAllTxsWithRetries(umi, program.provider.connection, signed, 1 + (txFee ? 1 : 0))
      })

      toast.promise(promise, {
        loading: "Converting NFT",
        success: "NFT converted successfully!",
        error: (err) => displayErrorFromLog(err, "Error converting NFT"),
      })

      await promise

      return newMint.publicKey
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function createConverter({
    selectedNft,
    collectionType,
    collection,
    existingCollection,
    logoFile,
    bgFile,
    name,
    slug,
    ruleSet,
  }: {
    selectedNft: DAS.GetAssetResponse
    collectionType: CollectionType
    collection: DigitalAsset | null
    existingCollection: DigitalAsset | null
    logoFile: File | null
    bgFile: File | null
    name: string
    slug: string
    ruleSet: PublicKey | null
  }) {
    try {
      setLoading(true)
      if (!selectedNft) {
        throw new Error("Select an NFT")
      }
      if (collectionType === "new" && !collection) {
        throw new Error("New collection not provided")
      }

      if (collectionType === "clone" && !existingCollection) {
        throw new Error("No existing collection to clone")
      }

      if (collectionType === "existing" && !existingCollection) {
        throw new Error("No existing collection to use")
      }
      const nftDa = await fetchDigitalAsset(umi, publicKey(selectedNft.id))
      const nftCollection = unwrapOptionRecursively(nftDa.metadata.collection)
      const collectionPk = (nftCollection?.verified && nftCollection.key) || null
      const collectionIdentifier =
        collectionPk || unwrapOptionRecursively(nftDa.metadata.creators)?.find((c) => c.verified)?.address

      if (!collectionIdentifier) {
        throw new Error("No Metaplex Certified Collection or First Verified Creator")
      }
      const converter = findConverterPda(umi, collectionIdentifier)

      const promise = Promise.resolve().then(async () => {
        let logo = null
        let bg = null
        if (logoFile || bgFile) {
          const uploadPromise = uploadFiles(umi, logoFile, bgFile)

          toast.promise(uploadPromise, {
            loading: "Uploading assets",
            success: "Uploaded successfully",
            error: "Error uploading files",
          })

          const res = await uploadPromise
          logo = res.logo
          bg = res.bg
        }

        const destinationCollection = (
          collectionType === "clone"
            ? generateSigner(umi)
            : collectionType === "existing"
            ? existingCollection
            : collection!
        )!

        const collectionDelegateRecord = findMetadataDelegateRecord(
          umi,
          destinationCollection!.publicKey,
          umi.identity.publicKey,
          converter
        )

        let tx = transactionBuilder()

        if (collectionType === "clone" && existingCollection) {
          tx = tx.add(getCloneCollectionInstruction(umi, existingCollection, destinationCollection as KeypairSigner))
        }

        tx = tx.add({
          instruction: fromWeb3JsInstruction(
            await program.methods
              .init(name, slug, logo, bg)
              .accounts({
                programConfig: findProgramConfigPda(umi),
                converter,
                nftMint: nftDa.publicKey,
                nftMetadata: nftDa.metadata.publicKey,
                destinationCollectionMint: destinationCollection.publicKey,
                destinationCollectionMetadata: findMetadataPda(umi, { mint: destinationCollection.publicKey })[0],
                collectionDelegateRecord,
                collectionIdentifier,
                ruleSet: ruleSet || null,
                tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
                sysvarInstructions: getSysvar("instructions"),
                authorizationRulesProgram: MPL_TOKEN_AUTH_RULES_PROGRAM_ID,
                authorizationRules: null,
              })
              .instruction()
          ),
          bytesCreatedOnChain:
            8 + 32 + (4 + 50) + (4 + 50) + 32 + 32 + 1 + (1 + 4 + 52) + (1 + 4 + 52) + (1 + 4 + 50) + 1 + 1 + 1,
          signers: [umi.identity],
        })

        const { chunks, txFee } = await packTx(umi, tx, feeLevel)
        const signed = await Promise.all(chunks.map((c) => c.buildAndSign(umi)))
        return await sendAllTxsWithRetries(umi, program.provider.connection, signed, 1 + (txFee ? 1 : 0))
      })

      toast.promise(promise, {
        loading: "Creating new // CONVERT app",
        success: "// CONVERT created successfully",
        error: (err) => displayErrorFromLog(err, "Error creating // CONVERT app"),
      })

      await promise
      navigate(`/${slug}`)
    } catch (err: any) {
      toast.error(err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleApproved(converter: ConverterWithPublicKey, approved: boolean) {
    try {
      setLoading(true)
      const promise = Promise.resolve().then(async () => {
        const tx = transactionBuilder().add({
          instruction: fromWeb3JsInstruction(
            await program.methods
              .toggleApproved(approved)
              .accounts({
                converter: converter.publicKey,
                program: program.programId,
                collectionIdentifier: converter.account.sourceCollection,
                programData: findProgramDataAddress(umi),
              })
              .instruction()
          ),
          bytesCreatedOnChain: 0,
          signers: [umi.identity],
        })

        const { chunks, txFee } = await packTx(umi, tx, feeLevel)
        const signed = await Promise.all(chunks.map((c) => c.buildAndSign(umi)))
        return await sendAllTxsWithRetries(umi, program.provider.connection, signed, txFee ? 1 : 0)
      })

      toast.promise(promise, {
        loading: approved ? "Approving converter" : "Revoking converter approval",
        success: approved ? "Converter approved" : "Converter approval revoked",
        error: (err) => displayErrorFromLog(err, approved ? "Error approving" : "Error revoking approval"),
      })

      await promise
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function update(
    converter: ConverterWithPublicKey,
    name: string,
    logoFile: File | null,
    bgFile: File | null,
    ruleSet?: string
  ) {
    try {
      setLoading(true)
      const promise = Promise.resolve().then(async () => {
        const { logo: newLogo, bg: newBg } = await uploadFiles(umi, logoFile, bgFile)
        const tx = transactionBuilder().add({
          instruction: fromWeb3JsInstruction(
            await program.methods
              .updateConverter(name, newLogo || converter.account.logo, newBg || converter.account.bg)
              .accounts({
                converter: converter.publicKey,
                ruleSet: ruleSet ? publicKey(ruleSet) : null,
              })
              .instruction()
          ),
          bytesCreatedOnChain: 0,
          signers: [umi.identity],
        })
        const { chunks, txFee } = await packTx(umi, tx, feeLevel)
        const signed = await Promise.all(chunks.map((c) => c.buildAndSign(umi)))
        return await sendAllTxsWithRetries(umi, program.provider.connection, signed, txFee ? 1 : 0)
      })

      toast.promise(promise, {
        loading: "Updating converter",
        success: "Converter updated",
        error: (err) => displayErrorFromLog(err, "Error updating"),
      })
      await promise
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function createCoreConverter({
    selectedNft,
    name,
    slug,
    logoFile,
    bgFile,
    existingCollection,
  }: {
    selectedNft: DAS.GetAssetResponse
    name: string
    slug: string
    logoFile: File | null
    bgFile: File | null
    existingCollection: DigitalAsset | null
  }) {
    try {
      setLoading(true)
      const promise = Promise.resolve().then(async () => {
        let logo = null
        let bg = null
        if (logoFile || bgFile) {
          const uploadPromise = uploadFiles(umi, logoFile, bgFile)

          toast.promise(uploadPromise, {
            loading: "Uploading assets",
            success: "Uploaded successfully",
            error: "Error uploading files",
          })

          const res = await uploadPromise
          logo = res.logo
          bg = res.bg
        }

        const collectionIdentifier = existingCollection?.publicKey
        const converter = findConverterPda(umi, collectionIdentifier!)
        const uri = existingCollection?.metadata.uri!
        const da = await fetchDigitalAsset(umi, publicKey(selectedNft.id))
        const destinationCollection = generateSigner(umi)
        const tx = transactionBuilder().add({
          instruction: fromWeb3JsInstruction(
            await program.methods
              .initCore(name, slug, uri, logo, bg)
              .accounts({
                programConfig: findProgramConfigPda(umi),
                converter,
                collectionIdentifier,
                nftMint: da.publicKey,
                nftMetadata: da.metadata.publicKey,
                destinationCollection: destinationCollection.publicKey,
                authority: umi.identity.publicKey,
                coreProgram: MPL_CORE_PROGRAM_ID,
              })
              .instruction()
          ),
          bytesCreatedOnChain: 0,
          signers: [umi.identity, destinationCollection],
        })

        const { chunks, txFee } = await packTx(umi, tx, feeLevel)
        const signed = await Promise.all(chunks.map((c) => c.buildAndSign(umi)))
        return await sendAllTxsWithRetries(umi, program.provider.connection, signed, txFee ? 1 : 0)
      })

      toast.promise(promise, {
        loading: "Creating Core converter",
        success: "Core converter created",
        error: (err) => displayErrorFromLog(err, "Error creating Core converter"),
      })
      await promise
      navigate(`/${slug}`)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function createNiftyConverter({
    selectedNft,
    name,
    slug,
    logoFile,
    bgFile,
    existingCollection,
  }: {
    selectedNft: DAS.GetAssetResponse
    name: string
    slug: string
    logoFile: File | null
    bgFile: File | null
    existingCollection: DigitalAsset | null
  }) {
    try {
      setLoading(true)
      const promise = Promise.resolve().then(async () => {
        let logo = null
        let bg = null
        if (logoFile || bgFile) {
          const uploadPromise = uploadFiles(umi, logoFile, bgFile)

          toast.promise(uploadPromise, {
            loading: "Uploading assets",
            success: "Uploaded successfully",
            error: "Error uploading files",
          })

          const res = await uploadPromise
          logo = res.logo
          bg = res.bg
        }

        const collectionIdentifier = existingCollection?.publicKey
        const converter = findConverterPda(umi, collectionIdentifier!)
        const uri = existingCollection?.metadata.uri!
        const description = (await fetchJsonMetadata(umi, uri)).description
        const da = await fetchDigitalAsset(umi, publicKey(selectedNft.id))
        const destinationCollection = generateSigner(umi)
        const collectionDetails = unwrapOptionRecursively(existingCollection?.metadata.collectionDetails)

        const tx = transactionBuilder().add({
          instruction: fromWeb3JsInstruction(
            await program.methods
              .initNifty(
                name,
                description || "",
                slug,
                uri,
                logo,
                bg,
                collectionDetails?.__kind === "V1"
                  ? collectionDetails.size
                    ? new BN(collectionDetails.size.toString())
                    : null
                  : null
              )
              .accounts({
                programConfig: findProgramConfigPda(umi),
                converter,
                collectionIdentifier,
                nftMint: da.publicKey,
                nftMetadata: da.metadata.publicKey,
                destinationCollection: destinationCollection.publicKey,
                authority: umi.identity.publicKey,
                niftyProgram: ASSET_PROGRAM_ID,
              })
              .instruction()
          ),
          bytesCreatedOnChain: 0,
          signers: [umi.identity, destinationCollection],
        })

        const { chunks, txFee } = await packTx(umi, tx, feeLevel)
        const signed = await Promise.all(chunks.map((c) => c.buildAndSign(umi)))
        return await sendAllTxsWithRetries(umi, program.provider.connection, signed, txFee ? 1 : 0)
      })

      toast.promise(promise, {
        loading: "Creating Core converter",
        success: "Core converter created",
        error: (err) => displayErrorFromLog(err, "Error creating Core converter"),
      })
      await promise
      navigate(`/${slug}`)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Context.Provider
      value={{
        loading,
        deleteConverter,
        convert,
        createConverter,
        toggleApproved,
        update,
        createCoreConverter,
        createNiftyConverter,
        convertCore,
        convertNifty,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useTxs = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error("useTxs must be used in a TxsProvider")
  }

  return context
}
