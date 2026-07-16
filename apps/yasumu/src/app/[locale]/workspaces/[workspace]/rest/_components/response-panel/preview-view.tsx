'use client';

import type { ReactElement } from 'react';

import {
  ImageViewer,
  VideoViewer,
  AudioViewer,
  HtmlViewer,
  CsvViewer,
  TextViewer,
  BinaryViewer,
  PdfViewer,
  getContentType,
  categorizeContent,
} from '@/components/responses/viewers';

import type { RestResponse } from '../../_lib/rest-request';
import { MAX_TEXT_BODY_SIZE, MAX_BINARY_BODY_SIZE } from '../../_lib/rest-request';
import { formatBytes } from './utils';

interface PreviewViewProps {
  response: RestResponse;
  blobUrl: string | null;
}

export function PreviewView({ response, blobUrl }: PreviewViewProps) {
  const contentType = getContentType(response.headers);
  const category = categorizeContent(contentType);

  if (response.bodyTruncated) {
    const maxSize = response.bodyType === 'text' ? formatBytes(MAX_TEXT_BODY_SIZE) : formatBytes(MAX_BINARY_BODY_SIZE);

    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-4">
        <p className="font-medium">Response body too large to preview</p>
        <p className="text-sm">
          Size: {formatBytes(response.size)} (max: {maxSize})
        </p>
      </div>
    );
  }

  const binaryFallback = <BinaryViewer contentType={contentType} />;

  const withBlob = (render: (src: string) => ReactElement) => (blobUrl ? render(blobUrl) : binaryFallback);

  const withText = (render: (body: string) => ReactElement) =>
    response.textBody ? render(response.textBody) : binaryFallback;

  const renderers: Record<string, () => ReactElement> = {
    image: () => withBlob((src) => <ImageViewer src={src} />),
    video: () => withBlob((src) => <VideoViewer src={src} />),
    audio: () => withBlob((src) => <AudioViewer src={src} />),
    pdf: () => withBlob((src) => <PdfViewer src={src} />),
    html: () => withText((body) => <HtmlViewer body={body} />),
    csv: () => withText((body) => <CsvViewer body={body} />),
    text: () => withText((body) => <TextViewer body={body} />),
    binary: () => binaryFallback,
  };

  return (renderers[category] ?? renderers.binary)();
}
