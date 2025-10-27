import { DopplerSDK, getAirlockOwner } from '@whetstone-research/doppler-sdk'
import { createPublicClient, createWalletClient, http, parseEther, custom } from 'viem'
import { base, baseSepolia } from 'wagmi/chains'
import { useMemo, useCallback } from 'react'
import { useAccount } from 'wagmi'

export const useDoppler = () => {
  const account = useAccount()

  // Public client is static — it doesn't depend on the user.
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: base,
        transport: custom(window.ethereum),
      }),
    []
  )

  // Wallet client depends on the connected address.
  const walletClient = useMemo(() => {
    if (!account.address) return null
    return createWalletClient({
      chain: base,
      transport: custom(window.ethereum),
      account,
    })
  }, [account])

  // Initialize SDK when both clients are ready.
  const sdk = useMemo(() => {
    if (!publicClient || !walletClient) return null
    return new DopplerSDK({
      publicClient,
      walletClient,
      chainId: base.id,
    })
  }, [publicClient, walletClient])

  const createStaticAuction = useCallback(async () => {
    if (!sdk || !account.address) {
      throw new Error('SDK not initialized or wallet not connected')
    }

    const airlockOwner = await getAirlockOwner(publicClient)

    const params = sdk
      .buildStaticAuction()
      .tokenConfig({
        name: 'My Token',
        symbol: 'MTK',
        tokenURI: 'https://example.com/token-metadata.json',
      })
      .saleConfig({
        initialSupply: parseEther('1000000000'), // 1 billion tokens
        numTokensToSell: parseEther('900000000'), // 900 million for sale
        numeraire: '0x4200000000000000000000000000000000000006', // WETH on Base
      })
      .poolByTicks({ startTick: 175000, endTick: 225000, fee: 3000 })
      .withVesting({
        duration: BigInt(365 * 24 * 60 * 60),
        cliffDuration: 0,
        // Optional: Specify multiple vesting beneficiaries
        // recipients: [account.address, '0xTeamWallet...', '0xAdvisorWallet...'],
        // amounts: [parseEther('50000000'), parseEther('30000000'), parseEther('20000000')]
      })
      .withMigration({
        type: 'uniswapV4',
        fee: 3000,
        tickSpacing: 60,
        streamableFees: {
          lockDuration: 365 * 24 * 60 * 60, // 1 year
          beneficiaries: [
            { beneficiary: account.address, shares: parseEther('0.95') }, // 95%
            { beneficiary: airlockOwner, shares: parseEther('0.05') }, // 5%
          ],
        },
      })
      .withUserAddress(account.address)
      .withGovernance({ type: 'default' })
      .build()
    
      let result
      try {
        result = await sdk.factory.simulateCreateStaticAuction(params)
        console.log('result', result)
      } catch (error) {
        console.error('Error simulating create static auction:', error)
        throw error
      }
      return result
  }, [sdk, account.address, publicClient])

  return { sdk, createStaticAuction }
}
