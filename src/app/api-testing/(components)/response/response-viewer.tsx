'use client';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TabsContent } from '@/components/ui/tabs';
import PrettyResponseViewer from './pretty-response-viewer';
import { ResponseHeaders } from './response-headers';
import { cn } from '@/lib/utils';
import { ResponseCookies } from './response-cookies';
import { ResponseStats } from './stats/response-stats';
import { useLayoutStore } from '@/stores/application/layout.store';
import { useResponse } from '@/stores/api-testing/response.store';
import { LoadingSpinner } from '@/components/layout/loading';
import { useRequestStore } from '@/stores/api-testing/request-config.store';
import { useEffect } from 'react';
import { useDebounceCallback } from 'usehooks-ts';

export default function ResponseViewer() {
  const { orientation } = useLayoutStore();
  const {
    headers,
    cookies,
    body,
    pending,
    responseSize,
    responseStatus,
    responseTime,
  } = useResponse();

  const { current } = useRequestStore();

  const save = useDebounceCallback(() => {
    if (!current) return;

    current.setResponse({
      body,
      headers: headers.map((header) => ({
        key: header.key,
        value: header.value,
      })),
      size: responseSize,
      status: responseStatus,
      time: responseTime,
    });

    current.save().catch(Object);
  }, 500);

  useEffect(() => {
    if (current) {
      save();
    }
  }, [body, headers, responseSize, responseStatus, responseTime]);

  return (
    <div className={cn(orientation === 'horizontal' ? 'px-2' : 'p-2')}>
      <Tabs defaultValue="pretty" className="rounded-b-none">
        <div
          className={cn('flex items-center justify-between', {
            'opacity-20': pending,
          })}
        >
          <TabsList className="rounded-b-none border-x border-t">
            <TabsTrigger value="pretty">Pretty</TabsTrigger>
            <TabsTrigger value="raw">Raw</TabsTrigger>
            <TabsTrigger value="headers">
              Headers{' '}
              <span className="text-green-500 text-sm ml-2">
                ({headers.length})
              </span>
            </TabsTrigger>
            <TabsTrigger value="cookies">
              Cookies{' '}
              <span className="text-green-500 text-sm ml-2">
                ({cookies.length})
              </span>
            </TabsTrigger>
          </TabsList>
          <ResponseStats />
        </div>
        {pending ? (
          <LoadingSpinner className="h-auto" />
        ) : (
          <div
            className={cn(
              'border rounded-b-sm p-2 overflow-y-auto',
              orientation === 'vertical' ? 'max-h-[400px]' : 'max-h-[90vh]'
            )}
          >
            <TabsContent value="pretty">
              <PrettyResponseViewer content={body} />
            </TabsContent>
            <TabsContent value="raw">
              <pre
                className={cn(
                  'word-break-break-all whitespace-pre-wrap text-sm'
                )}
              >
                {body}
              </pre>
            </TabsContent>
            <TabsContent value="headers">
              <ResponseHeaders headers={headers} />
            </TabsContent>

            <TabsContent value="cookies">
              <ResponseCookies cookies={cookies} />
            </TabsContent>
          </div>
        )}
      </Tabs>
    </div>
  );
}
