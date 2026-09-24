import React from 'react'

export default function UnAuthorizedPage() {
  return (
     <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">403</h1>
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>


         <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-olive text-primary-foreground rounded-lg hover:bg-olive/90"
        >
          Go Back
        </button>
    </div>
  )
}
