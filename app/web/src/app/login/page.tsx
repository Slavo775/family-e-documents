'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoginSchema, type LoginDto } from '@family-docs/types'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@family-docs/ui'

export default function LoginPage() {
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)

  const form = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginDto) {
    setAuthError(null)
    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    if (result?.error) {
      setAuthError('Invalid credentials')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader>
          <h1 className="text-2xl font-semibold text-brand-900">Sign in</h1>
        </CardHeader>
        <CardContent>
          {authError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  )
}
