'use client';

interface VideoViewerProps {
  src: string;
}

export function VideoViewer({ src }: VideoViewerProps) {
  return (
    <div className="flex items-center justify-center h-full p-4">
      <video src={src} controls className="max-w-full max-h-full">
        Your browser does not support the video element.
      </video>
    </div>
  );
}
