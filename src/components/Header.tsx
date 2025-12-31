'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface HeaderProps {
  account: string | null
  balance: string
  onConnect: () => void
}

export default function Header({ account, balance, onConnect }: HeaderProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/app', label: 'Dashboard' },
    { href: '/swap', label: 'Swap' },
    { href: '/nft', label: 'NFT' },
    { href: '/bridge', label: 'Bridge' },
  ]

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold">
              N
            </div>
            <span className="text-xl font-bold">NanoPy</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {account ? (
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm py-1">
                {parseFloat(balance).toFixed(2)} NPY
              </Badge>
              <Button variant="outline" size="sm">
                {account.slice(0, 6)}...{account.slice(-4)}
              </Button>
            </div>
          ) : (
            <Button onClick={onConnect} className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
