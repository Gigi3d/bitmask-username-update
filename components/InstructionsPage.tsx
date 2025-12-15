'use client';

import Link from 'next/link';
import FAQ from './FAQ';

export default function InstructionsPage() {
  return (
    <div className="min-h-screen bg-black px-4 flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center">
          {/* Yellow decorative line */}
          <div className="w-full h-1 bg-accent mb-6"></div>

          {/* Main heading */}
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            Welcome BitMask OG, we are ready for main-net
          </h1>

          {/* Yellow decorative shape */}
          <div className="flex justify-center mb-8">
            <div className="w-32 h-1 bg-accent"></div>
            <div className="w-1 h-12 bg-accent mx-4"></div>
            <div className="w-32 h-1 bg-accent"></div>
          </div>

          {/* Instructions */}
          <div className="space-y-4 mb-8 text-left max-w-2xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-black font-bold">
                1
              </div>
              <div>
                <h2 className="text-base font-semibold mb-1">Input your old bitmask username or nPUB key</h2>
                <p className="text-gray-300 text-sm">Enter the username or nPUB key you used during the campaign</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-black font-bold">
                2
              </div>
              <div>
                <h2 className="text-base font-semibold mb-1">Verify your telegram account associated with the campaign</h2>
                <p className="text-gray-300 text-sm">Confirm your Telegram handle matches the one from the campaign</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-black font-bold">
                3
              </div>
              <div>
                <h2 className="text-base font-semibold mb-1">Update your newly created mainnet bitmask wallet username</h2>
                <p className="text-gray-300 text-sm">Set your new username for the mainnet wallet</p>
              </div>
            </div>
          </div>

          {/* Yellow decorative line */}
          <div className="w-full h-1 bg-accent mb-8"></div>

          {/* CTA Button */}
          <Link
            href="/update"
            className="inline-block bg-accent text-black font-bold text-lg px-12 py-3 rounded-lg hover:opacity-90 transition-opacity mb-12"
          >
            START
          </Link>
        </div>

        {/* FAQ Section - Only show first question in viewport */}
        <div className="mt-12">
          <FAQ />
        </div>
      </div>
    </div>
  );
}
