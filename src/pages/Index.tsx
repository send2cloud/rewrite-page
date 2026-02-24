import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StyleGrid } from "@/components/home/StyleGrid";
import { UrlForm } from "@/components/home/UrlForm";
import { validateUrl, stripProtocol } from "@/core/url";

const Index = () => {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [customStyle, setCustomStyle] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path.length > 1) {
      const targetUrl = path.substring(1);
      if (!targetUrl.includes('/')) {
        navigate(`/tldr/${encodeURIComponent(targetUrl)}`);
      } else {
        navigate(`/${targetUrl}`);
      }
    }
  }, [location.pathname]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setUrl(input);
    setIsValidUrl(validateUrl(input));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUrl) {
      toast({ title: "Invalid URL", description: "Please enter a valid URL", variant: "destructive" });
      return;
    }
    const clean = stripProtocol(url);
    navigate(customStyle.trim() ? `/${customStyle.trim()}/${clean}` : `/tldr/${clean}`);
  };

  const handleStyleClick = (styleId: string) => {
    if (isValidUrl) {
      navigate(`/${styleId}/${stripProtocol(url)}`);
    } else {
      setCustomStyle(styleId);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <header className="px-6 py-5 flex justify-between items-center">
        <div className="text-xl font-serif font-bold tracking-tight">rewrite.page</div>
        <ThemeToggle />
      </header>

      <main className="max-w-2xl mx-auto px-5 pt-16 pb-24">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-3">
          Rewrite any page.
        </h1>
        <p className="text-muted-foreground mb-10 text-base">
          Paste a URL, pick a style, read it your way.
        </p>

        <UrlForm
          url={url}
          customStyle={customStyle}
          isValidUrl={isValidUrl}
          onUrlChange={handleInputChange}
          onStyleChange={(e) => setCustomStyle(e.target.value)}
          onSubmit={handleSubmit}
        />

        <div className="mt-16">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Presets
          </h2>
          <StyleGrid
            selectedStyle={customStyle}
            onStyleClick={handleStyleClick}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
