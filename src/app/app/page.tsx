'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatEther } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Header from '@/components/Header'
import { NETWORKS, ACTIVE_NETWORKS, NetworkType, getNetwork, createClient, hasContracts as checkContracts, NFT_ABI } from '@/lib/config'

export default function Dashboard() {
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState('0')
  const [network, setNetwork] = useState<NetworkType | null>(null) // Detect from MetaMask
  const [stats, setStats] = useState({
    blockNumber: 0,
    nftSupply: 0,
    gasPrice: '0',
  })

  const activeNetwork = network || 'testnet'
  const networkConfig = NETWORKS[activeNetwork]
  const publicClient = createClient(activeNetwork)

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask!')
      return
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }) as string[]

      if (accounts && accounts.length > 0) {
        setAccount(accounts[0])

        const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string
        const detectedNetwork = getNetwork(chainId)
        setNetwork(detectedNetwork)

        try {
          const client = createClient(detectedNetwork)
          const bal = await client.getBalance({ address: accounts[0] as `0x${string}` })
          setBalance(formatEther(bal))
        } catch (e) {
          console.log('Balance fetch failed:', e)
        }
      }
    } catch (error) {
      console.error('Failed to connect:', error)
      alert('Connection failed: ' + (error as Error).message)
    }
  }

  const switchNetwork = (targetNetwork: NetworkType) => {
    // Just switch the display network - no MetaMask interaction needed
    setNetwork(targetNetwork)
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const contracts = networkConfig.contracts
        const hasNFT = contracts.NFT !== '0x0000000000000000000000000000000000000000'

        let blockNumber = BigInt(0)
        let gasPrice = BigInt(0)

        try {
          [blockNumber, gasPrice] = await Promise.all([
            publicClient.getBlockNumber(),
            publicClient.getGasPrice(),
          ])
        } catch (e) {
          console.log('RPC connection failed, network may be unavailable:', e)
        }

        let nftSupply = 0
        if (hasNFT) {
          try {
            nftSupply = Number(await publicClient.readContract({
              address: contracts.NFT,
              abi: NFT_ABI,
              functionName: 'totalSupply',
            }))
          } catch (e) {
            console.log('NFT contract not available on this network')
          }
        }

        setStats({
          blockNumber: Number(blockNumber),
          gasPrice: gasPrice.toString(),
          nftSupply,
        })
      } catch (e) {
        console.error('Failed to fetch stats:', e)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [network, publicClient, networkConfig.contracts])

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum === 'undefined') return

      // Always detect current chain, even without connected account
      const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string
      const detectedNetwork = getNetwork(chainId)
      setNetwork(detectedNetwork)

      const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[]
      if (accounts.length > 0) {
        setAccount(accounts[0])

        const client = createClient(detectedNetwork)
        const bal = await client.getBalance({ address: accounts[0] as `0x${string}` })
        setBalance(formatEther(bal))
      }

      window.ethereum.on('chainChanged', (...args: unknown[]) => {
        const chainId = args[0] as string
        const newNetwork = getNetwork(chainId)
        setNetwork(newNetwork)
      })
    }
    init()
  }, [])

  const hasNFTContract = checkContracts(activeNetwork)

  return (
    <div className="min-h-screen bg-background">
      <Header account={account} balance={balance} onConnect={connectWallet} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Your gateway to decentralized finance on NanoPy blockchain
            </p>
          </div>
          {/* Network Selector */}
          <div className="flex flex-wrap gap-2">
            {ACTIVE_NETWORKS.map((net) => (
              <Button
                key={net.id}
                variant={activeNetwork === net.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => switchNetwork(net.id)}
              >
                {net.shortName}
              </Button>
            ))}
          </div>
        </div>

        {/* Network Warning */}
        {!hasNFTContract && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-500 text-sm">
              Contracts not yet deployed on {networkConfig.displayName}. Some features are disabled.
            </p>
          </div>
        )}

        {/* L2 Info Banner */}
        {networkConfig.isL2 && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <p className="text-emerald-500 text-sm">
              You are on NanoPy Turbo (L2) - Faster transactions, lower fees!
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Block Height
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.blockNumber.toLocaleString()}</div>
              <Badge variant={networkConfig.isL2 ? 'default' : 'secondary'} className="mt-2">
                {networkConfig.displayName}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gas Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.gasPrice}</div>
              <p className="text-sm text-muted-foreground mt-2">wei</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                NFTs Minted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{hasNFTContract ? stats.nftSupply : 'N/A'}</div>
              <p className="text-sm text-muted-foreground mt-2">
                {hasNFTContract ? 'Total supply' : 'Not deployed'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-emerald-500/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Swap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Exchange NPY for USDN and other tokens
              </p>
              <Link href="/swap">
                <Button
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                  disabled={!hasNFTContract}
                >
                  {hasNFTContract ? 'Go to Swap' : 'Not available'}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-purple-500/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                NFT Marketplace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Mint, buy, and sell unique digital art
              </p>
              <Link href="/nft">
                <Button
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                  disabled={!hasNFTContract}
                >
                  {hasNFTContract ? 'Explore NFTs' : 'Not available'}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-blue-500/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Bridge
                <Badge variant="outline" className="text-xs">L1/L2</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Transfer NPY between L1 and L2
              </p>
              <Link href="/bridge">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-emerald-500">
                  Go to Bridge
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Network Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Add {networkConfig.chain.name} to MetaMask</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Network Name</p>
                <p className="font-mono">{networkConfig.chain.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Chain ID</p>
                <p className="font-mono">{networkConfig.chain.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">RPC URL</p>
                <p className="font-mono">{networkConfig.chain.rpcUrls.default.http[0]}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Currency Symbol</p>
                <p className="font-mono">{networkConfig.chain.nativeCurrency.symbol}</p>
              </div>
            </div>
            {networkConfig.isL2 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  This is a Layer 2 network built on top of {NETWORKS[networkConfig.l1Network!].displayName}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
