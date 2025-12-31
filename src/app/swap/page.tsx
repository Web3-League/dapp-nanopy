'use client'

import { useState, useEffect } from 'react'
import { formatEther, parseEther } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Header from '@/components/Header'
import { NETWORKS, getNetwork, createClient, DEX_ABI } from '@/lib/config'

type NetworkType = 'mainnet' | 'testnet' | 'turbo' | 'turbo-testnet'

export default function SwapPage() {
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState('0')
  const [network, setNetwork] = useState<NetworkType>('testnet') // Default to testnet
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [direction, setDirection] = useState<'NPY_TO_USDN' | 'USDN_TO_NPY'>('NPY_TO_USDN')
  const [loading, setLoading] = useState(false)
  const [reserves, setReserves] = useState({ npy: '0', usdn: '0' })
  const [price, setPrice] = useState('0')

  const networkConfig = NETWORKS[network]
  const publicClient = createClient(network)
  const hasContracts = networkConfig.contracts.DEX !== '0x0000000000000000000000000000000000000000'

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        }) as string[]
        setAccount(accounts[0])

        // Detect network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string
        const detectedNetwork = getNetwork(chainId)
        setNetwork(detectedNetwork)

        const client = createClient(detectedNetwork)
        const bal = await client.getBalance({ address: accounts[0] as `0x${string}` })
        setBalance(formatEther(bal))
      } catch (error) {
        console.error('Failed to connect:', error)
      }
    }
  }

  useEffect(() => {
    if (!hasContracts) return

    const fetchData = async () => {
      try {
        const [reserveNPY, reserveUSDN, priceNPY] = await Promise.all([
          publicClient.readContract({
            address: networkConfig.contracts.DEX,
            abi: DEX_ABI,
            functionName: 'reserveNPY',
          }),
          publicClient.readContract({
            address: networkConfig.contracts.DEX,
            abi: DEX_ABI,
            functionName: 'reserveUSDN',
          }),
          publicClient.readContract({
            address: networkConfig.contracts.DEX,
            abi: DEX_ABI,
            functionName: 'getPriceNPY',
          }),
        ])

        setReserves({
          npy: formatEther(reserveNPY),
          usdn: formatEther(reserveUSDN),
        })
        setPrice(formatEther(priceNPY))
      } catch (e) {
        console.error('Failed to fetch DEX data:', e)
      }
    }

    fetchData()
  }, [network, hasContracts, publicClient, networkConfig.contracts.DEX])

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum === 'undefined') return
      const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[]
      if (accounts.length > 0) {
        setAccount(accounts[0])

        const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string
        const detectedNetwork = getNetwork(chainId)
        setNetwork(detectedNetwork)

        const client = createClient(detectedNetwork)
        const bal = await client.getBalance({ address: accounts[0] as `0x${string}` })
        setBalance(formatEther(bal))
      }

      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainId: unknown) => {
        const newNetwork = getNetwork(chainId as string)
        setNetwork(newNetwork)
      })
    }
    init()
  }, [])

  const calculateOutput = async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0 || !hasContracts) {
      setToAmount('')
      return
    }

    try {
      const amountIn = parseEther(amount)
      const reserveIn = direction === 'NPY_TO_USDN'
        ? parseEther(reserves.npy)
        : parseEther(reserves.usdn)
      const reserveOut = direction === 'NPY_TO_USDN'
        ? parseEther(reserves.usdn)
        : parseEther(reserves.npy)

      const zero = BigInt(0)
      if (reserveIn === zero || reserveOut === zero) {
        setToAmount('0')
        return
      }

      const amountOut = await publicClient.readContract({
        address: networkConfig.contracts.DEX,
        abi: DEX_ABI,
        functionName: 'getAmountOut',
        args: [amountIn, reserveIn, reserveOut],
      })

      setToAmount(formatEther(amountOut))
    } catch (e) {
      console.error('Calculate failed:', e)
      setToAmount('0')
    }
  }

  const handleFromChange = (value: string) => {
    setFromAmount(value)
    calculateOutput(value)
  }

  const checkNetwork = async (): Promise<boolean> => {
    if (typeof window.ethereum === 'undefined') return false

    const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string
    if (chainId !== networkConfig.chainIdHex) {
      alert(`Mauvais reseau! Veuillez ajouter ${networkConfig.chain.name} dans MetaMask:\n\n` +
        `Network: ${networkConfig.chain.name}\n` +
        `RPC URL: ${networkConfig.chain.rpcUrls.default.http[0]}\n` +
        `Chain ID: ${networkConfig.chain.id}\n` +
        `Symbol: ${networkConfig.chain.nativeCurrency.symbol}`)
      return false
    }
    return true
  }

  const handleSwap = async () => {
    if (!account || !fromAmount || !hasContracts) return
    if (!await checkNetwork()) return

    setLoading(true)
    try {
      alert('Swap feature coming soon! DEX contract needs to be deployed.')
    } catch (e) {
      console.error('Swap failed:', e)
    }
    setLoading(false)
  }

  const switchDirection = () => {
    setDirection(d => d === 'NPY_TO_USDN' ? 'USDN_TO_NPY' : 'NPY_TO_USDN')
    setFromAmount('')
    setToAmount('')
  }

  // Show message if no contracts
  if (!hasContracts) {
    return (
      <div className="min-h-screen bg-background">
        <Header account={account} balance={balance} onConnect={connectWallet} />
        <main className="container mx-auto px-4 py-8 max-w-lg">
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-xl font-bold mb-4">Swap not available</h2>
              <p className="text-muted-foreground mb-4">
                DEX contracts are not yet deployed on {networkConfig.chain.name}.
              </p>
              <Badge variant="outline">Chain ID: {networkConfig.chain.id}</Badge>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header account={account} balance={balance} onConnect={connectWallet} />

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Swap</span>
              <div className="flex gap-2 items-center">
                <Badge variant={network === 'mainnet' ? 'secondary' : 'outline'}>
                  {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                </Badge>
                <Badge variant="secondary">0.3% fee</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* From */}
            <div className="bg-muted rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">From</span>
                <span className="text-sm text-muted-foreground">
                  Balance: {direction === 'NPY_TO_USDN' ? parseFloat(balance).toFixed(2) : '0'} {direction === 'NPY_TO_USDN' ? 'NPY' : 'USDN'}
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => handleFromChange(e.target.value)}
                  className="text-2xl bg-transparent border-none"
                />
                <Button variant="secondary" className="shrink-0">
                  {direction === 'NPY_TO_USDN' ? 'NPY' : 'USDN'}
                </Button>
              </div>
            </div>

            {/* Switch Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={switchDirection}
              >
                ↕
              </Button>
            </div>

            {/* To */}
            <div className="bg-muted rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">To</span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={toAmount}
                  readOnly
                  className="text-2xl bg-transparent border-none"
                />
                <Button variant="secondary" className="shrink-0">
                  {direction === 'NPY_TO_USDN' ? 'USDN' : 'NPY'}
                </Button>
              </div>
            </div>

            {/* Price Info */}
            <div className="text-sm text-muted-foreground text-center">
              1 NPY = ${parseFloat(price).toFixed(4)} USDN
            </div>

            {/* Swap Button */}
            {account ? (
              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                size="lg"
                onClick={handleSwap}
                disabled={loading || !fromAmount}
              >
                {loading ? 'Swapping...' : 'Swap'}
              </Button>
            ) : (
              <Button
                className="w-full"
                size="lg"
                onClick={connectWallet}
              >
                Connect Wallet
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Pool Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Pool Reserves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{parseFloat(reserves.npy).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">NPY</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{parseFloat(reserves.usdn).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">USDN</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
