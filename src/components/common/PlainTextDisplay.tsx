import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PlainTextDisplayProps {
  content: string;
  className?: string;
  asPlainText?: boolean;
}

/**
 * A component that displays content nicely using markdown formatting.
 */
const PlainTextDisplay = ({ content, className = '' }: PlainTextDisplayProps) => {
  // Check if we have any content to display
  const hasContent = content && content.trim().length > 0;

  if (!hasContent) {
    return (
      <div className="text-muted-foreground p-4 text-center border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 rounded-md font-sans">
        No content available to display.
      </div>
    );
  }

  return (
    <div className={`prose prose-stone dark:prose-invert max-w-none text-base md:text-lg leading-relaxed ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default PlainTextDisplay;
