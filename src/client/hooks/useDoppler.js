import { DopplerSDK } from '@whetstone-research/doppler-sdk'
import { createPublicClient, createWalletClient, http } from 'viem'
import { base, baseSepolia } from 'wagmi/chains'
import { useMemo } from 'react'
import { useAccount } from 'wagmi'

export const useDoppler = () => {
  const { address } = useAccount()

  // Public client is static — it doesn't depend on the user.
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http(),
      }),
    []
  )

  // Wallet client depends on the connected address.
  const walletClient = useMemo(() => {
    if (!address) return null
    return createWalletClient({
      chain: baseSepolia,
      transport: http(),
      account: address,
    })
  }, [address])

  // Initialize SDK when both clients are ready.
  const sdk = useMemo(() => {
    if (!publicClient || !walletClient) return null
    return new DopplerSDK({
      publicClient,
      walletClient,
      chainId: baseSepolia.id,
    })
  }, [publicClient, walletClient])

  return sdk
}
