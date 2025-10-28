import 'dotenv-flow/config'
import { DopplerSDK, getAirlockOwner } from '@whetstone-research/doppler-sdk'
import { createPublicClient, createWalletClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base, baseSepolia, monadTestnet } from 'viem/chains'

async function createStaticAuction() {
  const privateKey = process.env.PRIVATE_KEY
  console.log('privateKey', privateKey)
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable not set')
  }

  const rpcUrl = 'https://monad-testnet.g.alchemy.com/v2/G086tYMJqytqsd2V-e2Vy'

  const account = privateKeyToAccount(privateKey)

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(rpcUrl),
  })

  const walletClient = createWalletClient({
    chain: monadTestnet,
    transport: http(rpcUrl),
    account,
  })

  const sdk = new DopplerSDK({
    publicClient,
    walletClient,
    chainId: monadTestnet.id,
  })

  const airlockOwner = await getAirlockOwner(publicClient)

  const params = sdk
    .buildDynamicAuction()
    .tokenConfig({
      name: 'TEST DYNAMIC',
      symbol: 'TEST',
      tokenURI: 'https://example.com/dynamic-token.json',
    })
    .saleConfig({
      initialSupply: parseEther('10000000'), // 10M tokens
      numTokensToSell: parseEther('5000000'), // Sell 5M tokens
      numeraire: '0x4200000000000000000000000000000000000006', // WETH on Base
    })
    .poolConfig({ fee: 3000, tickSpacing: 60 })
    .auctionByTicks({
      durationDays: 7,
      epochLength: 3600,
      startTick: -92103,
      endTick: -69080,
      minProceeds: parseEther('100'),
      maxProceeds: parseEther('5000'),
    })
    .withMigration({
      type: 'uniswapV4',
      fee: 3000,
      tickSpacing: 60,
      streamableFees: {
        lockDuration: 365 * 24 * 60 * 60,
        beneficiaries: [
          { beneficiary: account.address, shares: parseEther('0.95') }, // 95% (1e18 WAD)
          { beneficiary: airlockOwner, shares: parseEther('0.05') }, // 5% (1e18 WAD)
          // Modify beneficiaries as needed - shares must sum to 1e18 (100%)
          // { beneficiary: '0xBeneficiary1...', shares: parseEther('0.5') }, // 50%
          // { beneficiary: '0xBeneficiary2...', shares: parseEther('0.3') }, // 30%
          // { beneficiary: '0xBeneficiary3...', shares: parseEther('0.2') }, // 20%
        ],
      },
    })
    .withGovernance({ type: 'default' })
    .withUserAddress(account.address)
    .build()

  try {
    console.log('Creating static auction with address:', account.address)

    const simulation = await sdk.factory.simulateCreateStaticAuction(params)
    console.log('success')

    return simulation
  } catch (error) {
    console.error('Error creating static auction:', error)
    throw error
  }
}

createStaticAuction()
  .then(() => {
    console.log('Static auction created successfully!')
    process.exit(0)
  })
  .catch(error => {
    console.error('Failed to create static auction:', error)
    process.exit(1)
  })
