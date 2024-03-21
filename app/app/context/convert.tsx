import * as anchor from "@coral-xyz/anchor"
import { PropsWithChildren, createContext, useContext } from "react"
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react"
import { metadata } from "~/idl/convert.json"
import { Convert, IDL } from "~/types/convert"

const programId = new anchor.web3.PublicKey(metadata.address)

const Context = createContext<anchor.Program<Convert> | undefined>(undefined)

export function ConvertProvider({ children }: PropsWithChildren) {
  const wallet = useAnchorWallet()
  const { connection } = useConnection()
  const provider = new anchor.AnchorProvider(connection, wallet!, {})

  const program = new anchor.Program(IDL, programId, provider)
  return <Context.Provider value={program}>{children}</Context.Provider>
}

export const useConvert = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error("useConvert must be used in an ConvertProvider")
  }

  return context
}
