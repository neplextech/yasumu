'use client';

interface AudioViewerProps {
  src: string;
}

export function AudioViewer({ src }: AudioViewerProps) {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <audio src={src} controls className="w-full max-w-md">
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
