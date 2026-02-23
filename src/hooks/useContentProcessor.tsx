import * as React from 'react';
import { toast } from "@/components/ui/use-toast";

import { ErrorCodeType, determineErrorCodeFromMessage, getToastTitleForError } from '@/core/errors';
import { normalizeUrl } from '@/core/url';
import { summarizationService } from '@/core/summarization';

interface ContentProcessorResult {
  originalContent: string;
  summary: string;
  isLoading: boolean;
  error: Error & { errorCode?: ErrorCodeType } | null;
  progress: number;
}

export const useContentProcessor = (
  url: string | undefined,
  style: string,
  bulletCount?: number
): ContentProcessorResult => {
  const [originalContent, setOriginalContent] = React.useState<string>('');
  const [summary, setSummary] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error & { errorCode?: ErrorCodeType } | null>(null);
  const [progress, setProgress] = React.useState<number>(0);


  React.useEffect(() => {
    if (!url) {
      setIsLoading(false);
      setError(Object.assign(new Error("No URL provided"), { errorCode: "URL_ERROR" as ErrorCodeType }));
      return;
    }

    console.log("Processing content with style:", style, "and bullet count:", bulletCount);

    const processContent = async () => {
      setIsLoading(true);
      setError(null);
      setSummary(''); // Reset summary to avoid showing stale content
      setOriginalContent(''); // Reset original content
      setProgress(10);

      try {
        const fullUrl = normalizeUrl(url);

        console.log("Processing URL:", fullUrl, "with style:", style, "and bullet count:", bulletCount);
        setProgress(20);
        setProgress(40);

        // Add a timeout to detect long-running requests
        const timeoutDuration = 30000; // 30 seconds

        try {
          console.log("Calling Summarization Service with params:", { url: fullUrl, style, bulletCount });

          const data = await summarizationService.process({
            url: fullUrl,
            style: style,
            bulletCount: bulletCount
          });

          console.log("Received response from Summarization Service");

          setProgress(80);

          if (!data.summary || data.summary.trim() === '') {
            throw Object.assign(
              new Error("Received empty summary from AI service"),
              { errorCode: "AI_SERVICE_ERROR" as ErrorCodeType }
            );
          }

          setSummary(data.summary);
          setOriginalContent(data.originalContent);
          setProgress(100);
        } catch (apiError: any) {
          console.error('Error processing URL with summarization service:', apiError);

          // If the error is a timeout error from our Promise.race
          if (apiError.message && apiError.message.includes("timed out")) {
            throw Object.assign(
              new Error("The request took too long to complete. The website might be too large or our service is experiencing high load."),
              { errorCode: "CONNECTION_ERROR" as ErrorCodeType }
            );
          }

          throw apiError;
        }
      } catch (error: any) {
        console.error('Error in content processing:', error);

        // Create enhanced error object with error code if not already present
        const enhancedError = error.errorCode ?
          error :
          Object.assign(
            new Error(error.message || "Failed to process content"),
            { errorCode: determineErrorCodeFromMessage(error.message) as ErrorCodeType }
          );

        setError(enhancedError);

        toast({
          title: getToastTitleForError(enhancedError.errorCode as ErrorCodeType),
          description: enhancedError.message,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    processContent();
  }, [url, style, bulletCount]);

  return { originalContent, summary, isLoading, error, progress };
};
