'use client'

import { Alert, AlertDescription, AlertTitle, Button } from '@family-docs/ui'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error(error)

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
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
    </div>
  )
}
