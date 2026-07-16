import { Button } from '@yasumu/ui/components/button';
import Link from 'next/link';
import React from 'react';
import { FaArrowRight } from 'react-icons/fa6';

import { BackgroundGrid } from '../components/background-grid';

export default function NotFound() {
  return (
    <div className="animate-fade-in relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden py-20 lg:py-32">
      <BackgroundGrid />
      <div className="from-background-dark absolute inset-0 z-0 bg-gradient-to-t via-transparent to-transparent"></div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h1 className="mb-4 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-7xl font-bold tracking-tight text-transparent md:text-9xl">
          404
        </h1>
        <h2 className="mb-6 text-2xl font-bold text-white md:text-3xl">Page not found</h2>
        <p className="text-text-secondary mx-auto mt-4 mb-10 max-w-lg text-lg leading-relaxed">
          {"Sorry, we couldn't find the page you're looking for. Perhaps you've mistyped the URL? Be sure to check your spelling."}
        </p>
        <Button
          asChild
          className="h-12 rounded-lg bg-white px-8 text-base font-medium text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:bg-gray-200 hover:shadow-[0_0_25px_rgba(255,255,255,0.25)]"
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
