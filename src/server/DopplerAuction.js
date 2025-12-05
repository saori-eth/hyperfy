import 'dotenv-flow/config'
import { DopplerSDK, getAirlockOwner } from '@whetstone-research/doppler-sdk'
import { createPublicClient, createWalletClient, http, parseEther, isAddress, getAddress } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { monad, monadTestnet } from 'viem/chains'

async function createMulticurveAuction() {
  const privateKey = process.env.PRIVATE_KEY

  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable not set')
  }

  // Mode switch: 'mainnet' or 'testnet' (default)
  const MODE = (process.env.CHAIN_MODE || 'testnet').toLowerCase()
  const isMainnet = MODE === 'mainnet'

  const rpcUrl = isMainnet
    ? 'https://monad-mainnet.g.alchemy.com/v2/WrbA3A-mra41HOZTZqoljUKh_X5yWqRW'
    : 'https://monad-testnet.g.alchemy.com/v2/WrbA3A-mra41HOZTZqoljUKh_X5yWqRW'

  const account = privateKeyToAccount(privateKey)

  const chain = isMainnet ? monad : monadTestnet

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  })

  const wallet = createWalletClient({
    chain,
    transport: http(rpcUrl),
    account,
  })

  const sdk = new DopplerSDK({
    publicClient,
    wallet,
    chainId: chain.id,
  })

  const airlockOwner = await getAirlockOwner(publicClient)

  const tokenName = 'My Token'
  const tokenSymbol = 'MTK'
  const tokenURI = 'https://example.com/token-metadata.json'

  const totalSupplyValue = parseEther('1000000000')
  const numTokensToSellValue = parseEther('900000000')

  const fee = 0.0003
  const feeBeneficiary = wallet.account.address
  const airlockBeneficiary = airlockOwner

  const vestingDurationSeconds = 365 * 24 * 60 * 60

  const initializerAddress = getAddress(
    isMainnet ? '0xce3099b2f07029b086e5e92a1573c5f5a3071783' : '0xA3C847eAb58eAa9cbc215C785c9cfBc19CDABD5f'
  )

  const params = sdk
    .buildMulticurveAuction()
    .withV4MulticurveInitializer(initializerAddress)
    .tokenConfig({
      name: tokenName,
      symbol: tokenSymbol,
      tokenURI,
      yearlyMintRate: 0n,
    })
    .saleConfig({
      initialSupply: totalSupplyValue,
      numTokensToSell: numTokensToSellValue,
      numeraire: '0x7ba905b8f4e07a4f6403743a3d0639a88b069e07', // Quote in the chain's native token
    })
    .withMulticurveAuction({
      fee: Math.round(parseFloat(fee) * 10000),
      tickSpacing: 100,
      curves: [
        // assumes MON price is .032
        { tickLower: -48500, tickUpper: -23600, numPositions: 10, shares: parseEther('0.5') }, // ~$250k - ~$3m
        { tickLower: -27700, tickUpper: 2300, numPositions: 5, shares: parseEther('0.25') }, // $2m - $40m
        { tickLower: -7500, tickUpper: 34500, numPositions: 5, shares: parseEther('0.225') }, // ~$15m - ~$1b
        { tickLower: 34500, tickUpper: 887200, numPositions: 1, shares: parseEther('0.025') }, // tail ~$1b+
      ],
      beneficiaries: [
        { beneficiary: feeBeneficiary, shares: parseEther('0.95') },
        { beneficiary: airlockBeneficiary, shares: parseEther('0.05') },
      ],
    })
    .withVesting({
      duration: vestingDurationSeconds,
      recipients: [wallet.account.address, airlockOwner],
      amounts: [parseEther('0.95'), parseEther('0.05')],
    })
    .withIntegrator('0x0000000000000000000000000000000000000000')
    .withGovernance({ type: 'noOp' })
    .withMigration({ type: 'noOp' })
    .withUserAddress(wallet.account.address)
    .build()

  try {
    const { asset, pool } = await sdk.factory.simulateCreateMulticurve(params)
    console.log('token', asset)
    console.log('pool', pool)
  } catch (error) {
    console.error('Error creating auction:', error)
    throw error
  }
}

createMulticurveAuction()
