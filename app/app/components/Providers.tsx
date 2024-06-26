import { NextUIProvider } from "@nextui-org/react"
import { PropsWithChildren } from "react"
import { WalletProviders } from "./WalletProvider"
import { UmiProvider } from "~/context/umi"
import { DigitalAssetsProvider } from "~/context/digital-assets"
import { PriorityFeesProvider } from "~/context/priority-fees"
import { ThemeProvider } from "~/context/theme"
import { Theme } from "~/types/types"
import { ConvertProvider } from "~/context/convert"
import { TxsProvider } from "~/context/txs"

export function Providers({ children, rpcHost, theme }: PropsWithChildren<{ rpcHost: string; theme?: Theme }>) {
  return (
    <NextUIProvider>
      <WalletProviders rpcHost={rpcHost}>
        <UmiProvider rpcHost={rpcHost}>
          <PriorityFeesProvider>
            <ConvertProvider>
              <TxsProvider>
                <ThemeProvider theme={theme}>{children}</ThemeProvider>
              </TxsProvider>
            </ConvertProvider>
          </PriorityFeesProvider>
        </UmiProvider>
      </WalletProviders>
    </NextUIProvider>
  )
}
