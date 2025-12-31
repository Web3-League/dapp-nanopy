import { createPublicClient, http, defineChain } from 'viem'

// ============= Environment-based configuration =============
// RPC host can be overridden via environment variable
const RPC_HOST = process.env.NEXT_PUBLIC_RPC_HOST || '51.68.125.99'

// ============= Chain definitions =============

// L1 Mainnet (7770)
export const nanopyMainnet = defineChain({
  id: 7770,
  name: 'NanoPy',
  nativeCurrency: { name: 'NanoPy', symbol: 'NPY', decimals: 18 },
  rpcUrls: {
    default: { http: [`http://${RPC_HOST}:8545`] },
  },
})

// L1 Testnet (77777)
export const nanopyTestnet = defineChain({
  id: 77777,
  name: 'Pyralis Testnet',
  nativeCurrency: { name: 'NanoPy', symbol: 'NPY', decimals: 18 },
  rpcUrls: {
    default: { http: [`http://${RPC_HOST}:8546`] },
  },
})

// L2 Turbo Mainnet (77702)
export const nanopyTurbo = defineChain({
  id: 77702,
  name: 'NanoPy Turbo',
  nativeCurrency: { name: 'NanoPy', symbol: 'NPY', decimals: 18 },
  rpcUrls: {
    default: { http: [`http://${RPC_HOST}:8547`] },
  },
})

// L2 Turbo Testnet (777702)
export const nanopyTurboTestnet = defineChain({
  id: 777702,
  name: 'NanoPy Turbo Testnet',
  nativeCurrency: { name: 'NanoPy', symbol: 'NPY', decimals: 18 },
  rpcUrls: {
    default: { http: [`http://${RPC_HOST}:8548`] },
  },
})

// Default to mainnet (for backwards compatibility)
export const nanopy = nanopyMainnet

// ============= Network type and configuration =============

export type NetworkType = 'mainnet' | 'testnet' | 'turbo' | 'turbo-testnet'

export interface NetworkConfig {
  chain: ReturnType<typeof defineChain>
  chainIdHex: string
  isL2: boolean
  l1Network?: NetworkType
  displayName: string
  shortName: string
  contracts: {
    DEX: `0x${string}`
    USDN: `0x${string}`
    NFT: `0x${string}`
    BRIDGE: `0x${string}`
    ORACLE: `0x${string}`
  }
}

// Network configs - contract addresses can be set via environment variables
export const NETWORKS: Record<NetworkType, NetworkConfig> = {
  mainnet: {
    chain: nanopyMainnet,
    chainIdHex: '0x1e5a',
    isL2: false,
    displayName: 'NanoPy Mainnet',
    shortName: 'L1',
    contracts: {
      DEX: (process.env.NEXT_PUBLIC_MAINNET_DEX || '0xede9d1fc39fa3a1474c2c5b7844299ce0edea76f') as `0x${string}`,
      USDN: (process.env.NEXT_PUBLIC_MAINNET_USDN || '0xa77fdeca1f624a57ccd07b0e3a9bcbcdd75f9f89') as `0x${string}`,
      NFT: (process.env.NEXT_PUBLIC_MAINNET_NFT || '0x1e68c7e965761ca06038fd157c640d5675db228d') as `0x${string}`,
      BRIDGE: (process.env.NEXT_PUBLIC_MAINNET_BRIDGE || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      ORACLE: (process.env.NEXT_PUBLIC_MAINNET_ORACLE || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    },
  },
  testnet: {
    chain: nanopyTestnet,
    chainIdHex: '0x12fd1',
    isL2: false,
    displayName: 'Pyralis Testnet',
    shortName: 'L1 Test',
    contracts: {
      DEX: (process.env.NEXT_PUBLIC_TESTNET_DEX || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      USDN: (process.env.NEXT_PUBLIC_TESTNET_USDN || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      NFT: (process.env.NEXT_PUBLIC_TESTNET_NFT || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      BRIDGE: (process.env.NEXT_PUBLIC_TESTNET_BRIDGE || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      ORACLE: (process.env.NEXT_PUBLIC_TESTNET_ORACLE || '0x33d07a295784af1048321fa509eb16e4bb0a1b7f') as `0x${string}`,
    },
  },
  turbo: {
    chain: nanopyTurbo,
    chainIdHex: '0x12f86',
    isL2: true,
    l1Network: 'mainnet',
    displayName: 'NanoPy Turbo',
    shortName: 'L2',
    contracts: {
      DEX: (process.env.NEXT_PUBLIC_TURBO_DEX || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      USDN: (process.env.NEXT_PUBLIC_TURBO_USDN || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      NFT: (process.env.NEXT_PUBLIC_TURBO_NFT || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      BRIDGE: (process.env.NEXT_PUBLIC_TURBO_BRIDGE || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      ORACLE: (process.env.NEXT_PUBLIC_TURBO_ORACLE || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    },
  },
  'turbo-testnet': {
    chain: nanopyTurboTestnet,
    chainIdHex: '0xbdf86',
    isL2: true,
    l1Network: 'testnet',
    displayName: 'Turbo Testnet',
    shortName: 'L2 Test',
    contracts: {
      DEX: (process.env.NEXT_PUBLIC_TURBO_TESTNET_DEX || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      USDN: (process.env.NEXT_PUBLIC_TURBO_TESTNET_USDN || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      NFT: (process.env.NEXT_PUBLIC_TURBO_TESTNET_NFT || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      BRIDGE: (process.env.NEXT_PUBLIC_TURBO_TESTNET_BRIDGE || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      ORACLE: (process.env.NEXT_PUBLIC_TURBO_TESTNET_ORACLE || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    },
  },
}

// All available networks for UI selectors
export const NETWORK_LIST = Object.entries(NETWORKS).map(([key, config]) => ({
  id: key as NetworkType,
  ...config,
}))

// Only active networks (testnets for now)
export const ACTIVE_NETWORKS = NETWORK_LIST.filter(net =>
  net.id === 'testnet' || net.id === 'turbo-testnet'
)

// Get network from chain ID
export function getNetwork(chainId: number | string): NetworkType {
  const id = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId
  const found = Object.entries(NETWORKS).find(([, config]) => config.chain.id === id)
  return (found?.[0] as NetworkType) || 'mainnet'
}

// Get chain config
export function getChainConfig(network: NetworkType): NetworkConfig {
  return NETWORKS[network]
}

// Check if contracts are deployed on network
export function hasContracts(network: NetworkType): boolean {
  const config = NETWORKS[network]
  return config.contracts.NFT !== '0x0000000000000000000000000000000000000000'
}

// Check if bridge is available
export function hasBridge(network: NetworkType): boolean {
  const config = NETWORKS[network]
  return config.contracts.BRIDGE !== '0x0000000000000000000000000000000000000000'
}

// Create public client for a network
export function createClient(network: NetworkType = 'mainnet') {
  return createPublicClient({
    chain: NETWORKS[network].chain,
    transport: http(),
  })
}

// Default public client (mainnet)
export const publicClient = createClient('mainnet')

// Legacy exports for backwards compatibility
export const CONTRACTS = NETWORKS.mainnet.contracts

// ============= ABIs =============

export const NFT_ABI = [
  { inputs: [], name: "name", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSupply", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "mintFee", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "ownerOf", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "tokenURI", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "listings", outputs: [{ name: "seller", type: "address" }, { name: "price", type: "uint256" }, { name: "active", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "creators", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "uri", type: "string" }], name: "mint", outputs: [{ type: "uint256" }], stateMutability: "payable", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }, { name: "price", type: "uint256" }], name: "list", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "unlist", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "buy", outputs: [], stateMutability: "payable", type: "function" },
] as const

export const DEX_ABI = [
  { inputs: [], name: "reserveNPY", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "reserveUSDN", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getPriceNPY", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "minUsdnOut", type: "uint256" }], name: "swapNPYForUSDN", outputs: [{ type: "uint256" }], stateMutability: "payable", type: "function" },
  { inputs: [{ name: "usdnIn", type: "uint256" }, { name: "minNpyOut", type: "uint256" }], name: "swapUSDNForNPY", outputs: [{ type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "amountIn", type: "uint256" }, { name: "reserveIn", type: "uint256" }, { name: "reserveOut", type: "uint256" }], name: "getAmountOut", outputs: [{ type: "uint256" }], stateMutability: "pure", type: "function" },
] as const

// Bridge ABI for L1 <-> L2 transfers
export const BRIDGE_ABI = [
  // Deposit (L1 -> L2)
  { inputs: [], name: "deposit", outputs: [], stateMutability: "payable", type: "function" },
  // Withdraw (L2 -> L1)
  { inputs: [{ name: "amount", type: "uint256" }], name: "initiateWithdrawal", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "withdrawalId", type: "uint256" }], name: "finalizeWithdrawal", outputs: [], stateMutability: "nonpayable", type: "function" },
  // View functions
  { inputs: [], name: "l2Bridge", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "sequencer", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalDeposited", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "user", type: "address" }], name: "deposits", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "user", type: "address" }], name: "pendingWithdrawals", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  // Events
  { anonymous: false, inputs: [{ indexed: true, name: "from", type: "address" }, { indexed: false, name: "amount", type: "uint256" }], name: "Deposit", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "to", type: "address" }, { indexed: false, name: "amount", type: "uint256" }, { indexed: false, name: "withdrawalId", type: "uint256" }], name: "WithdrawalInitiated", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "to", type: "address" }, { indexed: false, name: "amount", type: "uint256" }], name: "WithdrawalFinalized", type: "event" },
] as const

// Oracle ABI for on-chain AI data
export const ORACLE_ABI = [
  // Submit data
  { inputs: [{ name: "keyStr", type: "string" }, { name: "value", type: "int256" }, { name: "confidence", type: "uint256" }], name: "submitDataString", outputs: [], stateMutability: "nonpayable", type: "function" },
  // Read data
  { inputs: [{ name: "keyStr", type: "string" }], name: "getDataString", outputs: [{ name: "value", type: "int256" }, { name: "confidence", type: "uint256" }, { name: "timestamp", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "key", type: "bytes32" }], name: "getLatest", outputs: [{ name: "value", type: "int256" }, { name: "confidence", type: "uint256" }, { name: "timestamp", type: "uint256" }], stateMutability: "view", type: "function" },
  // View functions
  { inputs: [], name: "owner", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSubmissions", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  // Events
  { anonymous: false, inputs: [{ indexed: true, name: "key", type: "bytes32" }, { indexed: false, name: "value", type: "int256" }, { indexed: false, name: "confidence", type: "uint256" }, { indexed: true, name: "submitter", type: "address" }], name: "DataSubmitted", type: "event" },
] as const
