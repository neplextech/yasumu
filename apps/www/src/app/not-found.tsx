import React from 'react';
import Link from 'next/link';
import { BackgroundGrid } from '../components/background-grid';
import { Button } from '@yasumu/ui/components/button';
import { FaArrowRight } from 'react-icons/fa6';

export default function NotFound() {
  return (
    <div className="animate-fade-in relative flex flex-col items-center justify-center min-h-[60vh] py-20 lg:py-32 overflow-hidden">
      <BackgroundGrid />
      <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent z-0"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-7xl md:text-9xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
          Page not found
        </h2>
        <p className="mt-4 max-w-lg mx-auto text-lg text-text-secondary leading-relaxed mb-10">
          Sorry, we couldn't find the page you're looking for. Perhaps you've
          mistyped the URL? Be sure to check your spelling.
        </p>
        <Button
          asChild
          className="h-12 px-8 text-base font-medium rounded-lg text-black bg-white hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)]"
        >
          <Link href="/">
            Go back home
            <FaArrowRight className="ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
