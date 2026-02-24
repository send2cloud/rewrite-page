import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface UrlFormProps {
  url: string;
  customStyle: string;
  isValidUrl: boolean;
  onUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStyleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const UrlForm = ({ url, customStyle, isValidUrl, onUrlChange, onStyleChange, onSubmit }: UrlFormProps) => (
  <form onSubmit={onSubmit} className="space-y-3">
    <Input
      type="text"
      placeholder="https://example.com/article"
      value={url}
      onChange={onUrlChange}
      className="h-12 bg-muted/50 border-border text-base"
    />
    <div className="flex gap-2">
      <Input
        type="text"
        placeholder="Style — e.g. larrydavid, french, gen-z…"
        value={customStyle}
        onChange={onStyleChange}
        className="h-12 bg-muted/50 border-border text-base flex-1"
      />
      <Button
        type="submit"
        disabled={!isValidUrl}
        className="h-12 px-6"
      >
        Go
        <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  </form>
);
