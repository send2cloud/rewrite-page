import React from 'react';
import { useNavigate } from 'react-router-dom';
import PlainTextDisplay from '@/components/common/PlainTextDisplay';
import ContentStateDisplay from '@/components/common/ContentStateDisplay';
import { ArrowLeft, Share2, Check, Copy, Twitter } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface MinimalContentViewProps {
  content: string;
  isLoading: boolean;
  error: Error & { errorCode?: string } | null;
  style: string;
}

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.432 1.781 3.632 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.287 3.263-.853 1.05-2.073 1.604-3.529 1.604h-.002c-1.584-.009-2.893-.553-3.783-1.575-.61-.702-.99-1.63-1.07-2.51h-.001c-.08-.88.09-1.755.482-2.469.576-1.048 1.593-1.723 2.862-1.9.627-.087 1.27-.07 1.91.05.55.103 1.064.29 1.53.559.027-.444.023-.895-.012-1.35l2.112-.105c.065.824.065 1.64-.003 2.432.604.466 1.063 1.045 1.363 1.727.74 1.684.793 4.46-1.313 6.521C17.237 23.158 14.97 23.98 12.186 24zm.061-7.478c.997 0 1.774-.374 2.31-1.113.434-.598.73-1.407.87-2.385a5.322 5.322 0 0 0-2.384-.86c-.503-.07-1.003-.074-1.486-.013-.837.107-1.409.49-1.702 1.04-.26.489-.336 1.067-.273 1.627.16 1.397 1.354 1.704 2.665 1.704z" />
  </svg>
);

const MinimalContentView = ({ content, isLoading, error, style = 'standard' }: MinimalContentViewProps) => {
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);
  const [textCopied, setTextCopied] = React.useState(false);

  const hasRawInput = Boolean(content) && typeof content === 'string';
  const hasRawContent = hasRawInput && content.trim().length > 0;
  const processedContent = hasRawContent ? content : '';
  const hasActualContent = Boolean(processedContent && processedContent.trim().length > 0);

  const pageUrl = window.location.href;
  const shareText = `rewrite.page — ${style}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url: pageUrl });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyAll = async () => {
    const fullText = `${shareText}\n${pageUrl}\n\n${processedContent}`;
    await navigator.clipboard.writeText(fullText);
    setTextCopied(true);
    setTimeout(() => setTextCopied(false), 2000);
  };

  const shareToX = () => {
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`, '_blank');
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`, '_blank');
  };

  const shareToThreads = () => {
    window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(`${shareText} ${pageUrl}`)}`, '_blank');
  };

  const iconBtn = "p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground";

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className={iconBtn} aria-label="Back to home">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">{style}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={shareToX} className={iconBtn} aria-label="Share on X" title="Share on X">
            <XIcon className="h-4 w-4" />
          </button>
          <button onClick={shareToFacebook} className={iconBtn} aria-label="Share on Facebook" title="Share on Facebook">
            <FacebookIcon className="h-4 w-4" />
          </button>
          <button onClick={shareToThreads} className={iconBtn} aria-label="Share on Threads" title="Share on Threads">
            <ThreadsIcon className="h-4 w-4" />
          </button>
          <button onClick={handleNativeShare} className={iconBtn} aria-label="Share link" title="Share link">
            {copied ? <Check className="h-5 w-5 text-primary" /> : <Share2 className="h-5 w-5" />}
          </button>
          {hasActualContent && (
            <button onClick={handleCopyAll} className={iconBtn} aria-label="Copy all content" title="Copy all">
              {textCopied ? <Check className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5" />}
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      {(isLoading || error || !hasActualContent) ? (
        <div className="max-w-2xl mx-auto p-4 mt-8">
          <ContentStateDisplay
            isLoading={isLoading}
            error={error}
            hasContent={hasActualContent}
            emptyMessage={`No content available${hasRawContent ? ' (empty after processing)' : ''}. Check the URL or try a different page.`}
            errorMessage={error ? `Error: ${error.message}` : undefined}
          />
        </div>
      ) : (
        <div className="p-4 max-w-2xl mx-auto">
          <PlainTextDisplay content={processedContent} asPlainText={true} />
        </div>
      )}
    </div>
  );
};

export default MinimalContentView;
