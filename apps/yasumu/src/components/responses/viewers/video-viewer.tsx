'use client';

interface VideoViewerProps {
  src: string;
}

export function VideoViewer({ src }: VideoViewerProps) {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <video src={src} controls className="max-h-full max-w-full">
        Your browser does not support the video element.
      </video>
    </div>
  );
}
