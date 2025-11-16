'use client';

import Link from 'next/link';

export default function InstructionsPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center">
        {/* Yellow decorative line */}
        <div className="w-full h-1 bg-accent mb-8"></div>
        
        {/* Main heading */}
        <h1 className="text-4xl md:text-6xl font-bold mb-12 text-white">
          Welcome BitMask OG, we are ready for main-net
        </h1>

        {/* Yellow decorative shape */}
        <div className="flex justify-center mb-12">
          <div className="w-32 h-1 bg-accent"></div>
          <div className="w-1 h-16 bg-accent mx-4"></div>
          <div className="w-32 h-1 bg-accent"></div>
        </div>

        {/* Instructions */}
        <div className="space-y-8 mb-12 text-left max-w-2xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-black font-bold">
              1
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Input your old bitmask username</h2>
              <p className="text-gray-300">Enter the username you used during the campaign</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-black font-bold">
              2
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Verify your telegram account associated with the campaign</h2>
              <p className="text-gray-300">Confirm your Telegram handle matches the one from the campaign</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-black font-bold">
              3
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Update your newly created mainnet bitmask wallet username</h2>
              <p className="text-gray-300">Set your new username for the mainnet wallet</p>
            </div>
          </div>
        </div>

        {/* Yellow decorative line */}
        <div className="w-full h-1 bg-accent mb-8"></div>

        {/* CTA Button */}
        <Link
          href="/update"
          className="inline-block bg-accent text-black font-bold text-lg px-12 py-4 rounded-lg hover:opacity-90 transition-opacity"
        >
          START
        </Link>
      </div>
    </div>
  );
}

