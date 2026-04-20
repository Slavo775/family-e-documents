import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

declare module 'next-auth' {
  interface User {
    role: string
    canRestrictDocs: boolean
    apiToken: string
  }
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      canRestrictDocs: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    canRestrictDocs: boolean
    apiToken: string
  }
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3011'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const res = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
          })

          if (!res.ok) return null

          const data = (await res.json()) as {
            user: { id: string; email: string; name: string; role: string; canRestrictDocs: boolean }
            token: string
          }

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            canRestrictDocs: data.user.canRestrictDocs,
            apiToken: data.token,
          }
        } catch {
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.canRestrictDocs = user.canRestrictDocs
        token.apiToken = user.apiToken
      }
      return token
    },
    session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email ?? '',
        name: token.name ?? '',
        role: token.role,
        canRestrictDocs: token.canRestrictDocs,
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}
