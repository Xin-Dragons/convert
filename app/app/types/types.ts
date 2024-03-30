import * as anchor from "@coral-xyz/anchor"
import { Convert } from "./convert"

export type Theme = {
  bg?: string | null
  logo?: string | null
}

export type ConverterWithPublicKey = {
  publicKey: anchor.web3.PublicKey
  account: Converter
}

export type Converter = anchor.IdlAccounts<Convert>["converter"]
export type ProgramConfig = anchor.IdlAccounts<Convert>["programConfig"]

export type Assets = { bg: string | null; logo: string | null }

export type CollectionType = "existing" | "clone" | "new"

export enum AssetType {
  PNFT = "pnft",
  CORE = "core",
  NIFTY = "nifty",
}
