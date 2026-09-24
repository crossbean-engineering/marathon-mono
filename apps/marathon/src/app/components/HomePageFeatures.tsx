import React from 'react'

function HomePageFeatures() {
  return (
   <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
        <div className="text-center">
        <div className="w-16 h-16 bg-golden/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-golden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        <h4 className="font-display font-semibold text-lg mb-2">Pre-Purchase Online</h4>
        <p className="text-muted-foreground text-sm">Get your ticket code before the event</p>
        </div>
        
        <div className="text-center">
        <div className="w-16 h-16 bg-golden/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-golden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        <h4 className="font-display font-semibold text-lg mb-2">Easy Redemption</h4>
        <p className="text-muted-foreground text-sm">Exchange your code for a wristband on event day</p>
        </div>
        
        <div className="text-center">
        <div className="w-16 h-16 bg-golden/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-golden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        </div>
        <h4 className="font-display font-semibold text-lg mb-2">Cashless Payments</h4>
        <p className="text-muted-foreground text-sm">Use your wristband for all activities</p>
        </div>
    </div>
  )
}

export default HomePageFeatures