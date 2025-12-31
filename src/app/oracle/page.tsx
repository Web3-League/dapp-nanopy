'use client'

import { useState, useEffect } from 'react'
import { formatEther, encodeFunctionData, parseAbi } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Header from '@/components/Header'
import { NETWORKS, NetworkType, getNetwork, createClient } from '@/lib/config'

// Oracle Node endpoints (decentralized network)
const ORACLE_NODES = [
  { url: 'http://51.68.125.99:8082', name: 'Node 1 (EU)', model: 'Qwen 2.5' },
  // Add more nodes here as they come online
]

// Available models on Oracle Network
const MODELS = [
  { id: 'Qwen/Qwen2.5-0.5B-Instruct', name: 'Qwen 2.5 (0.5B) - Fast', size: '0.5B' },
  { id: 'Qwen/Qwen2.5-1.5B-Instruct', name: 'Qwen 2.5 (1.5B) - Quality', size: '1.5B' },
  { id: 'microsoft/phi-2', name: 'Phi-2 (2.7B) - Smart', size: '2.7B' },
  { id: 'meta-llama/Llama-3.2-1B-Instruct', name: 'Llama 3.2 (1B)', size: '1B' },
]

export default function OraclePage() {
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState('0')
  const [network, setNetwork] = useState<NetworkType>('testnet')
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // AI state
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id)
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [inferenceTime, setInferenceTime] = useState(0)
  const [activeNode, setActiveNode] = useState<string | null>(null)

  // Node status
  const [nodeStatus, setNodeStatus] = useState<'online' | 'offline' | 'checking'>('checking')

  const networkConfig = NETWORKS[network]
  const oracleAddress = networkConfig.contracts.ORACLE
  const hasOracle = oracleAddress !== '0x0000000000000000000000000000000000000000'

  // Check node status on mount
  useEffect(() => {
    const checkNodes = async () => {
      setNodeStatus('checking')
      for (const node of ORACLE_NODES) {
        try {
          const res = await fetch(node.url + '/api/health', {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
          })
          if (res.ok) {
            setActiveNode(node.url)
            setNodeStatus('online')
            return
          }
        } catch {
          // Try next node
        }
      }
      setNodeStatus('offline')
    }
    checkNodes()
  }, [])

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
    }
  }

  const switchToTestnet = async () => {
    if (typeof window.ethereum === 'undefined') return

    const config = NETWORKS['testnet']
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: config.chainIdHex }],
      })
      setNetwork('testnet')
    } catch (switchError: unknown) {
      if ((switchError as { code?: number })?.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: config.chainIdHex,
              chainName: config.chain.name,
              nativeCurrency: config.chain.nativeCurrency,
              rpcUrls: [config.chain.rpcUrls.default.http[0]],
            }],
          })
          setNetwork('testnet')
        } catch (e) {
          console.log('Failed to add network:', e)
        }
      }
    }
  }

  // Query Oracle Node
  const queryOracle = async () => {
    if (!prompt || !activeNode) return

    setIsLoading(true)
    setError(null)
    const startTime = Date.now()

    try {
      const res = await fetch(activeNode + '/api/oracle/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          max_tokens: 150
        })
      })

      if (!res.ok) throw new Error('Oracle node error')

      const data = await res.json()

      setResponse(data.response || data.value || '')
      setConfidence(data.confidence ? Math.round(data.confidence * 100) : 85)
      setInferenceTime(Date.now() - startTime)
    } catch (err) {
      console.error('Query failed:', err)
      setError('Failed to query oracle node. Is it online?')
    } finally {
      setIsLoading(false)
    }
  }

  // Submit to blockchain via MetaMask
  const submitOnChain = async () => {
    if (!account || !hasOracle || !response) return
    setIsLoading(true)
    setError(null)
    setTxHash(null)

    try {
      await switchToTestnet()

      // Create key from prompt
      const key = 'ai:' + prompt.slice(0, 32).replace(/[^a-zA-Z0-9]/g, '_')
      const value = BigInt(confidence * 10)
      const conf = BigInt(confidence * 10)

      // ABI encode submitDataString(string,int256,uint256) using viem
      const oracleAbi = parseAbi([
        'function submitDataString(string keyStr, int256 value, uint256 confidence) external'
      ])

      const encodedData = encodeFunctionData({
        abi: oracleAbi,
        functionName: 'submitDataString',
        args: [key, value, conf]
      })

      // Estimate gas dynamically
      const txParams = {
        from: account,
        to: oracleAddress,
        data: encodedData,
      }

      let gasEstimate: string
      try {
        gasEstimate = await window.ethereum!.request({
          method: 'eth_estimateGas',
          params: [txParams]
        }) as string
        // Add 20% buffer
        gasEstimate = '0x' + Math.floor(parseInt(gasEstimate, 16) * 1.2).toString(16)
      } catch {
        // Fallback to 500k gas if estimation fails
        gasEstimate = '0x7A120'
      }

      // Get gas price for legacy transaction (NanoPy doesn't support EIP-1559)
      let gasPrice: string
      try {
        gasPrice = await window.ethereum!.request({
          method: 'eth_gasPrice',
          params: []
        }) as string
      } catch {
        gasPrice = '0x3B9ACA00' // 1 gwei fallback
      }

      console.log('Sending TX:', { to: oracleAddress, gas: gasEstimate, gasPrice, data: encodedData.slice(0, 50) + '...' })

      const hash = await window.ethereum!.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: oracleAddress,
          data: encodedData,
          gas: gasEstimate,
          gasPrice: gasPrice, // Force legacy transaction type
        }]
      }) as string

      setTxHash(hash)
    } catch (err: unknown) {
      console.error('Submit failed:', err)
      // Extract error message from various error formats
      const error = err as { message?: string; data?: { message?: string; data?: string }; reason?: string; code?: number }
      console.error('Error details:', { code: error.code, message: error.message, data: error.data, reason: error.reason })
      const errorMsg = error.reason || error.data?.message || error.data?.data || error.message || 'Unknown error'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // Quick prompts
  const quickPrompts = [
    'What is Ethereum?',
    'Explain smart contracts',
    'What is DeFi?',
    'How do oracles work?',
    'What is NanoPy?'
  ]

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

      window.ethereum.on('chainChanged', (chainId: string) => {
        setNetwork(getNetwork(chainId))
      })
    }
    init()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header account={account} balance={balance} onConnect={connectWallet} />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">
            NanoPy Oracle
          </h1>
          <p className="text-muted-foreground text-lg">
            AI-Powered Blockchain Oracle - Decentralized Node Network
          </p>
        </div>

        {/* Status Bar */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          <Badge variant="outline" className="px-4 py-2">
            <span className={`w-2 h-2 rounded-full mr-2 ${
              nodeStatus === 'online' ? 'bg-green-500' :
              nodeStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
            }`}></span>
            Oracle: {nodeStatus === 'online' ? 'Online' : nodeStatus === 'offline' ? 'Offline' : 'Checking...'}
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            Network: {networkConfig.displayName}
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            <span className={`w-2 h-2 rounded-full mr-2 ${account ? 'bg-green-500' : 'bg-red-500'}`}></span>
            Wallet: {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not Connected'}
          </Badge>
        </div>

        {/* Network Warning */}
        {!hasOracle && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
            <p className="text-yellow-500 text-sm mb-2">
              Oracle not deployed on {networkConfig.displayName}. Please switch to Pyralis Testnet.
            </p>
            <Button onClick={switchToTestnet} variant="outline" size="sm">
              Switch to Testnet
            </Button>
          </div>
        )}

        {/* Node Offline Warning */}
        {nodeStatus === 'offline' && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
            <p className="text-red-500 text-sm">
              No Oracle nodes available. Start a node with: <code className="bg-secondary px-2 py-1 rounded">nanopy-oracle serve</code>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - AI Query */}
          <div className="space-y-6">
            {/* Model Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-purple-500">[AI]</span>
                  Select Model
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Model (runs on Oracle Nodes)</label>
                  <select
                    className="w-full mt-2 p-3 bg-secondary border border-border rounded-lg"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    {MODELS.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="text-xs text-muted-foreground p-3 bg-secondary/50 rounded-lg">
                  <p className="font-semibold mb-1">How it works:</p>
                  <p>1. Your query is sent to decentralized Oracle Nodes</p>
                  <p>2. Nodes run AI models (GPU-powered)</p>
                  <p>3. Response is returned and can be submitted on-chain</p>
                </div>
              </CardContent>
            </Card>

            {/* Query Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-purple-500">[&gt;]</span>
                  Query Oracle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  className="w-full h-32 p-4 bg-secondary border border-border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ask the oracle anything..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />

                <div className="flex gap-2 flex-wrap">
                  {quickPrompts.map((qp) => (
                    <button
                      key={qp}
                      onClick={() => setPrompt(qp)}
                      className="px-3 py-1 text-xs bg-secondary border border-border rounded-full hover:border-purple-500 transition"
                    >
                      {qp}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={queryOracle}
                    disabled={!prompt || isLoading || nodeStatus !== 'online'}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    {isLoading ? 'Thinking...' : 'Query AI'}
                  </Button>
                  <Button
                    onClick={submitOnChain}
                    disabled={!account || !response || isLoading || !hasOracle}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
                  >
                    Submit On-Chain
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Response */}
          <div className="space-y-6">
            {/* Response */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-purple-500">[R]</span>
                  Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-h-[200px] p-4 bg-secondary rounded-lg">
                  {response ? (
                    <p className="whitespace-pre-wrap">{response}</p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Response will appear here...
                    </p>
                  )}
                </div>

                {response && (
                  <div className="mt-4 pt-4 border-t border-border flex gap-4 flex-wrap text-sm">
                    <div>
                      <span className="text-muted-foreground">Model:</span>{' '}
                      <span>{selectedModel.split('/').pop()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time:</span>{' '}
                      <span>{inferenceTime}ms</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Confidence:</span>{' '}
                      <span>{confidence}%</span>
                    </div>
                  </div>
                )}

                {txHash && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-green-500 text-sm">Submitted on-chain!</p>
                    <p className="text-xs font-mono truncate">{txHash}</p>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Node Info */}
            <Card>
              <CardHeader>
                <CardTitle>Oracle Network</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <div className="flex justify-between items-center p-2 bg-secondary rounded">
                  <span>Active Node:</span>
                  <span className="font-mono text-xs">{activeNode || 'None'}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-secondary rounded">
                  <span>Total Nodes:</span>
                  <span>{ORACLE_NODES.length}</span>
                </div>
                <div className="pt-4 border-t border-border">
                  <p><strong>Oracle Contract:</strong></p>
                  <p className="font-mono text-xs break-all">{hasOracle ? oracleAddress : 'Not deployed'}</p>
                </div>
                <div className="pt-2">
                  <p className="text-xs">Run your own node:</p>
                  <code className="text-xs bg-secondary px-2 py-1 rounded block mt-1">
                    pip install nanopy-oracle && nanopy-oracle serve --model Qwen/Qwen2.5-0.5B-Instruct
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
