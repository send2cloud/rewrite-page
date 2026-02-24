import React from 'react';
import { cn } from "@/lib/utils";

const STYLES = [
  { id: 'tldr', label: 'TLDR' },
  { id: 'eli5', label: 'ELI5' },
  { id: 'clickbait', label: 'Clickbait' },
  { id: 'top10', label: 'Top 10' },
  { id: 'haiku', label: 'Haiku' },
  { id: 'joke', label: 'Joke' },
  { id: 'pirate', label: 'Pirate' },
  { id: 'shakespeare', label: 'Shakespeare' },
  { id: 'bedtime', label: 'Bedtime Story' },
  { id: 'newspaper', label: 'Newspaper' },
  { id: 'thread', label: 'Tweet Thread' },
  { id: 'scifi', label: 'Sci-Fi' },
  { id: 'debate', label: 'Debate' },
  { id: 'recipe', label: 'Recipe' },
  { id: 'song', label: 'Song' },
  { id: 'email', label: 'Email' },
];

interface StyleGridProps {
  selectedStyle: string;
  onStyleClick: (id: string) => void;
}

export const StyleGrid = ({ selectedStyle, onStyleClick }: StyleGridProps) => (
  <div className="flex flex-wrap gap-2">
    {STYLES.map(style => (
      <button
        key={style.id}
        type="button"
        onClick={() => onStyleClick(style.id)}
        className={cn(
          "px-3 py-1.5 rounded-full text-sm border transition-colors",
          selectedStyle === style.id
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
        )}
      >
        {style.label}
      </button>
    ))}
  </div>
);
