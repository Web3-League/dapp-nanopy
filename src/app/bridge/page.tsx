'use client'

import { useState, useEffect } from 'react'
import { parseEther, formatEther } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Header from '@/components/Header'
import {
  NETWORKS,
  ACTIVE_NETWORKS,
  NetworkType,
  getNetwork,
  createClient,
  hasBridge,
} from '@/lib/config'

export default function BridgePage() {
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState('0')
  const [network, setNetwork] = useState<NetworkType>('testnet') // Default to testnet
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [l1Balance, setL1Balance] = useState('0')
  const [l2Balance, setL2Balance] = useState('0')
  const [txHash, setTxHash] = useState<string | null>(null)

  const networkConfig = NETWORKS[network]
  const isL2 = networkConfig.isL2
  const l1Network = isL2 ? networkConfig.l1Network! : network
  const l2Network = isL2 ? network : (network === 'mainnet' ? 'turbo' : 'turbo-testnet') as NetworkType

  const l1Config = NETWORKS[l1Network]
  const l2Config = NETWORKS[l2Network]

  const bridgeAvailable = hasBridge(l1Network) && hasBridge(l2Network)

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

        await updateBalances(accounts[0], detectedNetwork)
      }
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  const updateBalances = async (addr: string, currentNetwork: NetworkType) => {
    const currentL1 = NETWORKS[currentNetwork].isL2 ? NETWORKS[currentNetwork].l1Network! : currentNetwork
    const currentL2 = NETWORKS[currentNetwork].isL2 ? currentNetwork : (currentNetwork === 'mainnet' ? 'turbo' : 'turbo-testnet') as NetworkType

    // Get current network balance
    try {
      const client = createClient(currentNetwork)
      const bal = await client.getBalance({ address: addr as `0x${string}` })
      setBalance(formatEther(bal))
    } catch (e) {
      console.log('Failed to fetch current balance:', e)
      setBalance('0')
    }

    // Get L1 balance
    try {
      const l1Client = createClient(currentL1)
      const l1Bal = await l1Client.getBalance({ address: addr as `0x${string}` })
      setL1Balance(formatEther(l1Bal))
    } catch (e) {
      console.log('Failed to fetch L1 balance:', e)
      setL1Balance('0')
    }

    // Get L2 balance
    try {
      const l2Client = createClient(currentL2)
      const l2Bal = await l2Client.getBalance({ address: addr as `0x${string}` })
      setL2Balance(formatEther(l2Bal))
    } catch (e) {
      console.log('Failed to fetch L2 balance:', e)
      setL2Balance('0')
    }
  }

  const switchNetwork = (targetNetwork: NetworkType) => {
    // Just switch the display network - no MetaMask interaction needed
    setNetwork(targetNetwork)
  }

  const deposit = async () => {
    if (!account || !amount || !bridgeAvailable) return
    setIsLoading(true)
    setTxHash(null)

    try {
      // Switch to L1 if needed
      if (network !== l1Network) {
        await switchNetwork(l1Network)
      }

      const value = parseEther(amount)
      const bridgeAddress = l1Config.contracts.BRIDGE

      const tx = await window.ethereum!.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: bridgeAddress,
          value: '0x' + value.toString(16),
          data: '0xd0e30db0', // deposit() function selector
        }],
      })

      setTxHash(tx as string)
      setAmount('')

      // Refresh balances
      setTimeout(() => updateBalances(account, network), 3000)
    } catch (error) {
      console.error('Deposit failed:', error)
      alert('Deposit failed: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const withdraw = async () => {
    if (!account || !amount || !bridgeAvailable) return
    setIsLoading(true)
    setTxHash(null)

    try {
      // Switch to L2 if needed
      if (network !== l2Network) {
        await switchNetwork(l2Network)
      }

      const value = parseEther(amount)
      const bridgeAddress = l2Config.contracts.BRIDGE

      // Encode initiateWithdrawal(uint256 amount)
      const amountHex = value.toString(16).padStart(64, '0')
      const data = '0x' + 'c0d9bae8' + amountHex // initiateWithdrawal selector

      const tx = await window.ethereum!.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: bridgeAddress,
          value: '0x0',
          data: data,
        }],
      })

      setTxHash(tx as string)
      setAmount('')

      // Refresh balances
      setTimeout(() => updateBalances(account, network), 3000)
    } catch (error) {
      console.error('Withdrawal failed:', error)
      alert('Withdrawal failed: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum === 'undefined') return

      const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[]
      if (accounts.length > 0) {
        setAccount(accounts[0])

        const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string
        const detectedNetwork = getNetwork(chainId)
        setNetwork(detectedNetwork)
        await updateBalances(accounts[0], detectedNetwork)
      }

      window.ethereum.on('chainChanged', (chainId: unknown) => {
        const newNetwork = getNetwork(chainId as string)
        setNetwork(newNetwork)
        if (account) updateBalances(account, newNetwork)
      })
    }
    init()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header account={account} balance={balance} onConnect={connectWallet} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Bridge</h1>
          <p className="text-muted-foreground text-lg">
            Transfer NPY between L1 and L2 (Turbo)
          </p>
        </div>

        {/* Network Selector */}
        <div className="mb-6 flex flex-wrap gap-2">
          {ACTIVE_NETWORKS.map((net) => (
            <Button
              key={net.id}
              variant={network === net.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => switchNetwork(net.id)}
            >
              {net.shortName}
            </Button>
          ))}
        </div>

        {/* Bridge Not Available Warning */}
        {!bridgeAvailable && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-500">
              Bridge contracts not yet deployed. This feature will be available soon.
            </p>
          </div>
        )}

        {/* Balances */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {l1Config.displayName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{parseFloat(l1Balance).toFixed(4)} NPY</div>
              <p className="text-sm text-muted-foreground mt-1">Chain ID: {l1Config.chain.id}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {l2Config.displayName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{parseFloat(l2Balance).toFixed(4)} NPY</div>
              <p className="text-sm text-muted-foreground mt-1">Chain ID: {l2Config.chain.id}</p>
            </CardContent>
          </Card>
        </div>

        {/* Bridge Card */}
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Transfer NPY</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="deposit">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="deposit">
                  Deposit (L1 -&gt; L2)
                </TabsTrigger>
                <TabsTrigger value="withdraw">
                  Withdraw (L2 -&gt; L1)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="deposit">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Amount (NPY)
                    </label>
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Available: {parseFloat(l1Balance).toFixed(4)} NPY on {l1Config.shortName}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 py-4">
                    <Badge variant="outline">{l1Config.shortName}</Badge>
                    <span className="text-2xl">-&gt;</span>
                    <Badge variant="outline">{l2Config.shortName}</Badge>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-emerald-500"
                    onClick={deposit}
                    disabled={!account || !amount || isLoading || !bridgeAvailable}
                  >
                    {isLoading ? 'Processing...' : 'Deposit to L2'}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Deposits are processed instantly on L2
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="withdraw">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Amount (NPY)
                    </label>
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Available: {parseFloat(l2Balance).toFixed(4)} NPY on {l2Config.shortName}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 py-4">
                    <Badge variant="outline">{l2Config.shortName}</Badge>
                    <span className="text-2xl">-&gt;</span>
                    <Badge variant="outline">{l1Config.shortName}</Badge>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-emerald-500 to-blue-500"
                    onClick={withdraw}
                    disabled={!account || !amount || isLoading || !bridgeAvailable}
                  >
                    {isLoading ? 'Processing...' : 'Withdraw to L1'}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Withdrawals require ~7 days for security (challenge period)
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Transaction Hash */}
            {txHash && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-500">
                  Transaction submitted!
                </p>
                <p className="text-xs font-mono text-muted-foreground mt-1 break-all">
                  {txHash}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How Deposits Work</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>1. Send NPY to the L1 Bridge contract</p>
              <p>2. The sequencer detects your deposit</p>
              <p>3. Equivalent NPY is minted on L2</p>
              <p>4. Your L2 balance updates instantly</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How Withdrawals Work</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>1. Initiate withdrawal on L2</p>
              <p>2. Wait for the challenge period (7 days)</p>
              <p>3. Finalize withdrawal on L1</p>
              <p>4. Receive your NPY on L1</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
