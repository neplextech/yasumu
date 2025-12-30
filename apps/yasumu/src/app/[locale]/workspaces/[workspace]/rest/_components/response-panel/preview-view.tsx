'use client';

import type { RestResponse } from '../../_lib/rest-request';
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
import { formatBytes } from './utils';
import {
  MAX_TEXT_BODY_SIZE,
  MAX_BINARY_BODY_SIZE,
} from '../../_lib/rest-request';

interface PreviewViewProps {
  response: RestResponse;
  blobUrl: string | null;
}

export function PreviewView({ response, blobUrl }: PreviewViewProps) {
  const contentType = getContentType(response.headers);
  const category = categorizeContent(contentType);

  if (response.bodyTruncated) {
    const maxSize =
      response.bodyType === 'text'
        ? formatBytes(MAX_TEXT_BODY_SIZE)
        : formatBytes(MAX_BINARY_BODY_SIZE);
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground p-4">
        <p className="font-medium">Response body too large to preview</p>
        <p className="text-sm">
          Size: {formatBytes(response.size)} (max: {maxSize})
        </p>
      </div>
    );
  }

  switch (category) {
    case 'image':
      return blobUrl ? (
        <ImageViewer src={blobUrl} />
      ) : (
        <BinaryViewer contentType={contentType} />
      );
    case 'video':
      return blobUrl ? (
        <VideoViewer src={blobUrl} />
      ) : (
        <BinaryViewer contentType={contentType} />
      );
    case 'audio':
      return blobUrl ? (
        <AudioViewer src={blobUrl} />
      ) : (
        <BinaryViewer contentType={contentType} />
      );
    case 'html':
      return response.textBody ? (
        <HtmlViewer body={response.textBody} />
      ) : (
        <BinaryViewer contentType={contentType} />
      );
    case 'pdf':
      return blobUrl ? (
        <PdfViewer src={blobUrl} />
      ) : (
        <BinaryViewer contentType={contentType} />
      );
    case 'csv':
      return response.textBody ? (
        <CsvViewer body={response.textBody} />
      ) : (
        <BinaryViewer contentType={contentType} />
      );
    case 'text':
      return response.textBody ? (
        <TextViewer body={response.textBody} />
      ) : (
        <BinaryViewer contentType={contentType} />
      );
    case 'binary':
    default:
      return <BinaryViewer contentType={contentType} />;
  }
}
