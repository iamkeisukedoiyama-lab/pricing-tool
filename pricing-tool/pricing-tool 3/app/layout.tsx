import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Raksul Novelty 売価設定ツール',
  description: 'MD担当向け売価設定・競合比較ツール',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
