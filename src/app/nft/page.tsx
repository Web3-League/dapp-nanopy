'use client'

import { useState, useEffect } from 'react'
import { formatEther, parseEther, createWalletClient, custom } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Header from '@/components/Header'
import { NETWORKS, getNetwork, createClient, NFT_ABI, NetworkType } from '@/lib/config'

interface NFTItem {
  tokenId: number
  owner: string
  uri: string
  creator: string
  listing: {
    seller: string
    price: bigint
    active: boolean
  }
}

export default function NFTPage() {
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState('0')
  const [network, setNetwork] = useState<NetworkType>('testnet') // Default to testnet
  const [nfts, setNfts] = useState<NFTItem[]>([])
  const [loading, setLoading] = useState(false)
  const [mintUri, setMintUri] = useState('')
  const [mintFee, setMintFee] = useState('1')

  const networkConfig = NETWORKS[network]
  const publicClient = createClient(network)
  const hasContracts = networkConfig.contracts.NFT !== '0x0000000000000000000000000000000000000000'

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

  const fetchNFTs = async () => {
    if (!hasContracts) return

    try {
      const totalSupply = await publicClient.readContract({
        address: networkConfig.contracts.NFT,
        abi: NFT_ABI,
        functionName: 'totalSupply',
      })

      const fee = await publicClient.readContract({
        address: networkConfig.contracts.NFT,
        abi: NFT_ABI,
        functionName: 'mintFee',
      })
      setMintFee(formatEther(fee))

      const nftList: NFTItem[] = []
      for (let i = 0; i < Number(totalSupply); i++) {
        try {
          const [owner, uri, creator, listing] = await Promise.all([
            publicClient.readContract({
              address: networkConfig.contracts.NFT,
              abi: NFT_ABI,
              functionName: 'ownerOf',
              args: [BigInt(i)],
            }),
            publicClient.readContract({
              address: networkConfig.contracts.NFT,
              abi: NFT_ABI,
              functionName: 'tokenURI',
              args: [BigInt(i)],
            }),
            publicClient.readContract({
              address: networkConfig.contracts.NFT,
              abi: NFT_ABI,
              functionName: 'creators',
              args: [BigInt(i)],
            }),
            publicClient.readContract({
              address: networkConfig.contracts.NFT,
              abi: NFT_ABI,
              functionName: 'listings',
              args: [BigInt(i)],
            }),
          ])

          nftList.push({
            tokenId: i,
            owner: owner as string,
            uri: uri as string,
            creator: creator as string,
            listing: {
              seller: listing[0] as string,
              price: listing[1] as bigint,
              active: listing[2] as boolean,
            },
          })
        } catch (e) {
          console.error(`Failed to fetch NFT ${i}:`, e)
        }
      }

      setNfts(nftList)
    } catch (e) {
      console.error('Failed to fetch NFTs:', e)
    }
  }

  useEffect(() => {
    if (hasContracts) {
      fetchNFTs()
    }
  }, [network, hasContracts])

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

  const handleMint = async () => {
    if (!account || !mintUri || !hasContracts) return
    if (!await checkNetwork()) return

    setLoading(true)
    try {
      const walletClient = createWalletClient({
        chain: networkConfig.chain,
        transport: custom(window.ethereum!),
      })

      const hash = await walletClient.writeContract({
        address: networkConfig.contracts.NFT,
        abi: NFT_ABI,
        functionName: 'mint',
        args: [mintUri],
        value: parseEther(mintFee),
        account: account as `0x${string}`,
      })

      alert(`Minting... TX: ${hash}`)
      await publicClient.waitForTransactionReceipt({ hash })
      alert('NFT minted successfully!')
      setMintUri('')
      fetchNFTs()
    } catch (e) {
      console.error('Mint failed:', e)
      alert('Mint failed: ' + (e as Error).message)
    }
    setLoading(false)
  }

  const handleBuy = async (tokenId: number, price: bigint) => {
    if (!account || !hasContracts) return
    if (!await checkNetwork()) return

    setLoading(true)
    try {
      const walletClient = createWalletClient({
        chain: networkConfig.chain,
        transport: custom(window.ethereum!),
      })

      const hash = await walletClient.writeContract({
        address: networkConfig.contracts.NFT,
        abi: NFT_ABI,
        functionName: 'buy',
        args: [BigInt(tokenId)],
        value: price,
        account: account as `0x${string}`,
      })

      alert(`Buying... TX: ${hash}`)
      await publicClient.waitForTransactionReceipt({ hash })
      alert('NFT purchased successfully!')
      fetchNFTs()
    } catch (e) {
      console.error('Buy failed:', e)
      alert('Buy failed: ' + (e as Error).message)
    }
    setLoading(false)
  }

  // Show message if no contracts
  if (!hasContracts) {
    return (
      <div className="min-h-screen bg-background">
        <Header account={account} balance={balance} onConnect={connectWallet} />
        <main className="container mx-auto px-4 py-8 max-w-lg">
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-xl font-bold mb-4">NFT Marketplace not available</h2>
              <p className="text-muted-foreground mb-4">
                NFT contracts are not yet deployed on {networkConfig.chain.name}.
              </p>
              <Badge variant="outline">Chain ID: {networkConfig.chain.id}</Badge>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const listedNFTs = nfts.filter(n => n.listing.active)
  const myNFTs = nfts.filter(n => account && n.owner.toLowerCase() === account.toLowerCase())

  return (
    <div className="min-h-screen bg-background">
      <Header account={account} balance={balance} onConnect={connectWallet} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">NFT Marketplace</h1>
            <p className="text-muted-foreground">
              Mint, buy, and sell unique digital art on NanoPy
            </p>
          </div>
          <Badge variant={network === 'mainnet' ? 'secondary' : 'outline'}>
            {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
          </Badge>
        </div>

        <Tabs defaultValue="explore" className="space-y-6">
          <TabsList>
            <TabsTrigger value="explore">Explore</TabsTrigger>
            <TabsTrigger value="mint">Mint</TabsTrigger>
            <TabsTrigger value="my-nfts">My NFTs</TabsTrigger>
          </TabsList>

          {/* Explore Tab */}
          <TabsContent value="explore">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listedNFTs.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No NFTs listed for sale yet. Be the first to mint and list!
                  </CardContent>
                </Card>
              ) : (
                listedNFTs.map((nft) => (
                  <Card key={nft.tokenId} className="overflow-hidden">
                    <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <span className="text-6xl">🎨</span>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold">NFT #{nft.tokenId}</h3>
                        <Badge>For Sale</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-2">
                        {nft.uri}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">
                          {formatEther(nft.listing.price)} NPY
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleBuy(nft.tokenId, nft.listing.price)}
                          disabled={loading || !account}
                          className="bg-gradient-to-r from-purple-500 to-pink-500"
                        >
                          Buy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Mint Tab */}
          <TabsContent value="mint">
            <Card className="max-w-lg mx-auto">
              <CardHeader>
                <CardTitle>Mint New NFT</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Metadata URI (IPFS or HTTP)
                  </label>
                  <Input
                    placeholder="ipfs://... or https://..."
                    value={mintUri}
                    onChange={(e) => setMintUri(e.target.value)}
                  />
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mint Fee</span>
                    <span className="font-bold">{mintFee} NPY</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-muted-foreground">Royalty</span>
                    <span>2.5% on sales</span>
                  </div>
                </div>

                {account ? (
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                    onClick={handleMint}
                    disabled={loading || !mintUri}
                  >
                    {loading ? 'Minting...' : 'Mint NFT'}
                  </Button>
                ) : (
                  <Button className="w-full" onClick={connectWallet}>
                    Connect Wallet to Mint
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My NFTs Tab */}
          <TabsContent value="my-nfts">
            {!account ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">Connect your wallet to see your NFTs</p>
                  <Button onClick={connectWallet}>Connect Wallet</Button>
                </CardContent>
              </Card>
            ) : myNFTs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  You don&apos;t own any NFTs yet. Mint or buy one!
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myNFTs.map((nft) => (
                  <Card key={nft.tokenId} className="overflow-hidden">
                    <div className="aspect-square bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                      <span className="text-6xl">🎨</span>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold">NFT #{nft.tokenId}</h3>
                        {nft.listing.active && <Badge variant="secondary">Listed</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {nft.uri}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* All NFTs */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">All NFTs ({nfts.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {nfts.map((nft) => (
              <Card key={nft.tokenId} className="overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-slate-500/20 to-slate-600/20 flex items-center justify-center">
                  <span className="text-4xl">🎨</span>
                </div>
                <CardContent className="p-3">
                  <p className="font-bold text-sm">NFT #{nft.tokenId}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Owner: {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
