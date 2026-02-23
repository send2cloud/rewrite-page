
import React from 'react';

interface ContentStateDisplayProps {
  isLoading: boolean;
  error: Error | null;
  hasContent: boolean;
  loadingMessage?: string;
  errorMessage?: string;
  emptyMessage?: string;
}

/**
 * A component that displays different states (loading, error, empty)
 * for content-based components
 */
const ContentStateDisplay = ({ 
  isLoading, 
  error, 
  hasContent,
  loadingMessage = 'Loading...',
  errorMessage,
  emptyMessage = 'No content available'
}: ContentStateDisplayProps) => {
  if (isLoading) {
    return <div className="py-4 px-4 text-sm bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-foreground">{loadingMessage}</div>;
  }

  if (error) {
    return (
      <div className="py-4 px-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md">
        Error: {errorMessage || error.message}
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="py-4 px-4 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
        {emptyMessage}
        <p className="mt-2 text-xs">
          Try a different URL or check if the URL is accessible and contains readable content.
        </p>
      </div>
    );
  }

  return null;
};

export default ContentStateDisplay;
