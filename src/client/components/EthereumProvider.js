import { WagmiProvider, createConfig, http, injected } from 'wagmi'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'

import { base, baseSepolia } from 'wagmi/chains'

const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  connectors: [injected()],
  multiInjectedProviderDiscovery: true,
})

const queryClient = new QueryClient()

export const EthereumProvider = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
