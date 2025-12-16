'use client';

import Link from 'next/link';
import FAQ from './FAQ';

export default function InstructionsPage() {
  return (
    <div className="min-h-screen bg-black px-4 flex flex-col justify-center py-8">
      <div className="max-w-5xl mx-auto w-full">
        <div className="text-center">
          {/* Top yellow decorative line - full width */}
          <div className="w-full h-1 bg-accent mb-10"></div>

          {/* Main heading - larger and more prominent */}
          <h1 className="text-4xl md:text-6xl font-bold mb-8 text-white leading-tight">
            Welcome BitMask OG, we are ready for main-net
          </h1>

          {/* Yellow decorative T-shape */}
          <div className="flex justify-center mb-10">
            <div className="w-40 h-1 bg-accent"></div>
            <div className="w-1 h-20 bg-accent mx-4"></div>
            <div className="w-40 h-1 bg-accent"></div>
          </div>

          {/* Instructions - more spacious and prominent */}
          <div className="space-y-6 mb-10 text-left max-w-3xl mx-auto">
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent flex items-center justify-center text-black font-bold text-lg">
                1
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2 text-white">Input your old bitmask username or nPUB key</h2>
                <p className="text-gray-300 text-base">Enter the username or nPUB key you used during the campaign</p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent flex items-center justify-center text-black font-bold text-lg">
                2
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2 text-white">Update your newly created mainnet bitmask wallet username</h2>
                <p className="text-gray-300 text-base">Set your new username for the mainnet wallet</p>
              </div>
            </div>
          </div>

          {/* Bottom yellow decorative line - full width */}
          <div className="w-full h-1 bg-accent mb-10"></div>

          {/* CTA Button - larger and more prominent */}
          <Link
            href="/update"
            className="inline-block bg-accent text-black font-bold text-xl px-16 py-4 rounded-lg hover:opacity-90 transition-opacity mb-16"
          >
            START
          </Link>
        </div>

        {/* FAQ Section - clearly separated */}
        <div className="mt-16">
          <FAQ />
        </div>
      </div>
    </div>
  );
}
