'use client';

interface AudioViewerProps {
  src: string;
}

export function AudioViewer({ src }: AudioViewerProps) {
  return (
    <div className="flex items-center justify-center h-full p-4">
      <audio src={src} controls className="w-full max-w-md">
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
