'use client'

import { Alert, AlertDescription, AlertTitle, Button } from '@family-docs/ui'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // eslint-disable-next-line no-console
  console.error(error)

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md space-y-4">
          <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              An unexpected error occurred. Please try again or contact support if the problem
              persists.
            </AlertDescription>
          </Alert>
          <Button onClick={reset} variant="outline" className="w-full">
            Try again
          </Button>
        </div>
      </body>
    </html>
  )
}
