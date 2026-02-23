import React from 'react';
import { SummarizationStyle } from '@/types/settings';
import PlainTextDisplay from '@/components/common/PlainTextDisplay';
import ContentStateDisplay from '@/components/common/ContentStateDisplay';
import { simplifyToPlainText } from '@/utils/textFormatting';

interface MinimalContentViewProps {
  content: string;
  isLoading: boolean;
  error: Error & { errorCode?: string } | null;
  style: string;
}

/**
 * A minimal view component that displays content in a plain text format
 * for direct access or when rich formatting is not desired.
 */
const MinimalContentView = ({ content, isLoading, error, style = 'standard' }: MinimalContentViewProps) => {
  // First check if we have any input at all
  const hasRawInput = Boolean(content) && typeof content === 'string';

  // Then check if the input has actual content (not just whitespace)
  const hasRawContent = hasRawInput && content.trim().length > 0;

  // Apply plain text formatting to all content regardless of style
  const processedContent = hasRawContent ? content : '';

  // Check if we still have valid content after processing
  const hasActualContent = Boolean(processedContent && processedContent.trim().length > 0);

  // Show loading/error states or empty content message
  if (isLoading || error || !hasActualContent) {
    return (
      <div className="max-w-4xl mx-auto p-4 border border-border rounded-md shadow-sm bg-background">
        <ContentStateDisplay
          isLoading={isLoading}
          error={error}
          hasContent={hasActualContent}
          emptyMessage={`No content available for the URL${hasRawContent ? ' (content was empty after processing)' : ''}. Please check the URL or try a different page.`}
          errorMessage={error ? `Error: ${error.message}. The server-side processing failed. Please try again later or with a different URL.` : undefined}
        />
      </div>
    );
  }

  // Return content as true plain text without any styling
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <PlainTextDisplay content={processedContent} asPlainText={true} />
    </div>
  );
};

export default MinimalContentView;
