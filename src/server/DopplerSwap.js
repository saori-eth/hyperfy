import { CommandBuilder, CommandType, V4ActionBuilder, V4ActionType } from 'doppler-router'
import { maxUint256 } from 'viem'

// Constants for swaps
export const CONTRACT_BALANCE = BigInt('0x8000000000000000000000000000000000000000000000000000000000000000')
export const OPEN_DELTA = 0n // Use all available balance from previous operations

/**
 * Build commands for buying tokens with ETH directly via a V4 pool
 * ETH -> WETH -> Token (single V4 swap)
 */
export function buyEthV4({ weth, amountIn, minAmountOut, recipient, universalRouterAddress, tokenAddress, poolKey }) {
  const commandBuilder = new CommandBuilder()

  // Step 1: Wrap ETH to WETH (send to Universal Router)
  commandBuilder.addWrapEth(universalRouterAddress, amountIn)

  // Step 2: V4 Swap WETH -> Token
  // Determine swap direction based on which currency is WETH
  const isWethCurrency0 = poolKey.currency0.toLowerCase() === weth.toLowerCase()
  const zeroForOne = isWethCurrency0 // If WETH is currency0, swap from 0 to 1

  const actionBuilder = new V4ActionBuilder()
  const [actions, params] = actionBuilder
    // First settle the WETH from Universal Router's balance (payerIsUser=false)
    .addAction(
      V4ActionType.SETTLE,
      [weth, CONTRACT_BALANCE, false] // false = use router's balance, not user's
    )
    // Then swap using OPEN_DELTA (all available WETH from the SETTLE)
    .addSwapExactInSingle(
      poolKey,
      zeroForOne,
      OPEN_DELTA, // Use all available WETH from the SETTLE delta
      minAmountOut,
      '0x'
    )
    // Take all the token output
    .addAction(V4ActionType.TAKE_ALL, [tokenAddress, 0])
    .build()

  commandBuilder.addV4Swap(actions, params)

  // Step 3: Sweep any remaining tokens to recipient
  commandBuilder.addCommand(CommandType.SWEEP, [
    tokenAddress,
    recipient,
    0n, // sweep all
  ])

  return commandBuilder.build()
}

/**
 * Build commands for selling tokens for ETH directly via a V4 pool
 * Token -> WETH -> ETH (single V4 swap + unwrap)
 */
export function sellEthV4({
  weth,
  amountIn,
  minAmountOut,
  recipient,
  universalRouterAddress,
  tokenAddress,
  permit,
  permitSignature,
  poolKey,
}) {
  const commandBuilder = new CommandBuilder()

  // Add permit if provided (for spending tokens)
  if (permit && permitSignature) {
    commandBuilder.addPermit2Permit(permit, permitSignature)
  }

  // Step 1: V4 Swap Token -> WETH
  // Determine swap direction based on which currency is WETH
  const isWethCurrency0 = poolKey.currency0.toLowerCase() === weth.toLowerCase()
  const zeroForOne = !isWethCurrency0 // If WETH is currency1, swap from 1 to 0 (token -> WETH)

  const actionBuilder = new V4ActionBuilder()
  const [actions, params] = actionBuilder
    .addSwapExactInSingle(poolKey, zeroForOne, amountIn, minAmountOut, '0x')
    .addAction(
      V4ActionType.SETTLE_ALL,
      [tokenAddress, maxUint256] // Settle tokens from user (with permit)
    )
    .addAction(
      V4ActionType.TAKE,
      [weth, universalRouterAddress, OPEN_DELTA] // Take WETH to Universal Router
    )
    .build()

  commandBuilder.addV4Swap(actions, params)

  // Step 2: Unwrap WETH to ETH and send to recipient
  commandBuilder.addCommand(CommandType.UNWRAP_WETH, [
    recipient,
    0n, // unwrap all
  ])

  return commandBuilder.build()
}
