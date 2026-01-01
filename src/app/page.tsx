'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold">
          <span className="text-emerald-500">Nano</span>Py
        </div>
        <nav className="flex gap-4 items-center">
          <Link href="#features" className="text-muted-foreground hover:text-foreground">
            Features
          </Link>
          <Link href="#networks" className="text-muted-foreground hover:text-foreground">
            Networks
          </Link>
          <Link href="/WHITEPAPER.pdf" className="text-muted-foreground hover:text-foreground">
            Whitepaper
          </Link>
          <Link href="/app">
            <Button>Launch App</Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="outline" className="mb-4">
          Ethereum-Compatible
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Blockchain,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">
            in Python
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          The first Ethereum-compatible blockchain written entirely in Python.
          Full EVM support, Proof of Stake, and Layer 2 scaling.
          Readable, modifiable, accessible.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/app">
            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
              Launch App
            </Button>
          </Link>
          <Link href="https://pypi.org/project/nanopy-chain/" target="_blank">
            <Button size="lg" variant="outline">
              pip install nanopy-chain
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
          <div className="p-4">
            <div className="text-3xl font-bold text-emerald-500">100%</div>
            <div className="text-sm text-muted-foreground">Python L1</div>
          </div>
          <div className="p-4">
            <div className="text-3xl font-bold text-cyan-500">EVM</div>
            <div className="text-sm text-muted-foreground">Compatible</div>
          </div>
          <div className="p-4">
            <div className="text-3xl font-bold text-purple-500">L2</div>
            <div className="text-sm text-muted-foreground">Turbo Scaling</div>
          </div>
          <div className="p-4">
            <div className="text-3xl font-bold text-orange-500">PoS</div>
            <div className="text-sm text-muted-foreground">Consensus</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why NanoPy?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-4xl mb-4">🐍</div>
              <h3 className="text-xl font-bold mb-2">Pure Python</h3>
              <p className="text-muted-foreground">
                No Go, no Rust, no C++. Read and modify the entire blockchain codebase
                in the world's #1 programming language.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2">Full EVM</h3>
              <p className="text-muted-foreground">
                Deploy any Solidity smart contract. Compatible with MetaMask, Hardhat,
                and all Ethereum tools you already know.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-2">Layer 2 Ready</h3>
              <p className="text-muted-foreground">
                NanoPy Turbo L2 for high-throughput applications.
                10x faster with native bridge support.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Networks */}
      <section id="networks" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Networks</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* L1 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-bold">NanoPy L1</h3>
                <Badge>Testnet</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RPC URL</span>
                  <code className="text-xs">https://rpc.nanopy.eu</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chain ID</span>
                  <code>77777</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Symbol</span>
                  <code>NPY</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Block Time</span>
                  <code>12s</code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* L2 */}
          <Card className="border-emerald-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-bold">NanoPy Turbo L2</h3>
                <Badge variant="default" className="bg-emerald-500">L2</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RPC URL</span>
                  <code className="text-xs">https://l2.nanopy.eu</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chain ID</span>
                  <code>777702</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Symbol</span>
                  <code>NPY</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Block Time</span>
                  <code>10s</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tools */}
        <div className="flex justify-center gap-4 mt-8">
          <Link href="https://faucet.nanopy.eu" target="_blank">
            <Button size="lg" className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
              🚰 Get Test Tokens
            </Button>
          </Link>
          <Link href="https://scan.nanopy.eu" target="_blank">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
              🔍 Block Explorer
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to build?</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Get started with NanoPy in seconds. Install via pip, run a node,
          or deploy your first smart contract.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/app">
            <Button size="lg">Launch App</Button>
          </Link>
          <Link href="/WHITEPAPER.pdf">
            <Button size="lg" variant="outline">Read Whitepaper</Button>
          </Link>
        </div>

        {/* Install command */}
        <div className="mt-8 inline-block bg-muted rounded-lg p-4">
          <code className="text-sm">pip install nanopy-chain</code>
        </div>
      </section>

      {/* Quote */}
      <section className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground italic max-w-2xl mx-auto">
          "Web3 is the developer's sudoku - you solve crypto puzzles, consensus problems, smart contracts...
          And the bonus is you get to mess around a bit with the ecosystem. A blockchain in Python?
          That's not serious! Well that's the point, who cares, it works and it's fun.
          That's the original punk spirit of web3 - not the suits talking about institutional adoption,
          just devs having fun building weird stuff."
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              NanoPy - Blockchain, in Python
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="https://pypi.org/project/nanopy-chain/" target="_blank" className="text-muted-foreground hover:text-foreground">
                PyPI
              </Link>
              <Link href="/WHITEPAPER.pdf" className="text-muted-foreground hover:text-foreground">
                Whitepaper
              </Link>
              <Link href="/app" className="text-muted-foreground hover:text-foreground">
                App
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
