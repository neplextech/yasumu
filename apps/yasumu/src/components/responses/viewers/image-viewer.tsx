'use client';

interface ImageViewerProps {
  src: string;
}

export function ImageViewer({ src }: ImageViewerProps) {
  return (
    <div className="flex items-center justify-center h-full p-4 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23ccc%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23ccc%22%2F%3E%3C%2Fsvg%3E')]">
      <img
        src={src}
        alt="Response preview"
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
}
