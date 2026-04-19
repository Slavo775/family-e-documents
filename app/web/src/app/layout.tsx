import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Family E-Documents',
  description: 'Family document management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
