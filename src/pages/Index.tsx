import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowRight, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const AVAILABLE_STYLES = [
  { id: 'clickbait', label: 'Clickbait', desc: 'Shocking headlines & emotional language' },
  { id: 'top10', label: 'Top 10 List', desc: 'Numbered list of important points' },
  { id: 'todo', label: 'To-Do List', desc: 'Actionable checkbox items' },
  { id: 'haiku', label: 'Haiku', desc: 'Japanese-style 5-7-5 poetry' },
  { id: 'newspaper', label: 'Newspaper', desc: 'Journalism style with headline' },
  { id: 'eli5', label: "Explain Like I'm 5", desc: 'Simple language for children' },
  { id: 'joke', label: 'Joke', desc: 'Humor and comedy routine' },
  { id: 'poem', label: 'Poem', desc: 'Poetic expression with rhymes' },
  { id: 'recipe', label: 'Recipe', desc: 'Cooking recipe format' },
  { id: 'song', label: 'Song Lyrics', desc: 'Song with chorus and verses' },
  { id: 'shakespeare', label: 'Shakespeare', desc: 'Shakespearean style' },
  { id: 'thread', label: 'Tweet Thread', desc: 'Series of tweets (280 chars each)' },
  { id: 'tldr', label: 'TLDR Summary', desc: 'Extreme summary in 1-2 sentences' },
  { id: 'pirate', label: 'Pirate Talk', desc: 'Pirate speech and expressions' },
  { id: 'bedtime', label: 'Bedtime Story', desc: 'Soothing story with moral' },
  { id: 'motivational', label: 'Motivational', desc: 'Inspiring speech with quotes' },
  { id: 'email', label: 'Email', desc: 'Professional email format' },
  { id: 'scifi', label: 'Sci-Fi', desc: 'Futuristic science fiction story' },
  { id: 'medieval', label: 'Medieval', desc: 'Medieval tale or legend' },
  { id: 'debate', label: 'Debate', desc: 'Arguments from opposing sides' }
];

const Index = () => {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [customStyle, setCustomStyle] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    const path = location.pathname;
    if (path.length > 1) {
      const targetUrl = path.substring(1);
      processUrl(targetUrl);
    }
  }, [location.pathname]);

  const validateUrl = (input: string) => {
    try {
      const urlToCheck = input.startsWith('http') ? input : `http://${input}`;
      new URL(urlToCheck);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setUrl(input);
    setIsValidUrl(validateUrl(input));
  };

  const handleStyleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomStyle(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUrl) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
      return;
    }

    let processableUrl = url;
    if (processableUrl.startsWith('http://')) {
      processableUrl = processableUrl.substring(7);
    } else if (processableUrl.startsWith('https://')) {
      processableUrl = processableUrl.substring(8);
    }

    if (customStyle.trim()) {
      navigate(`/${customStyle.trim()}/${processableUrl}`);
    } else {
      navigate(`/tldr/${processableUrl}`);
    }
  };

  const processUrl = (targetUrl: string) => {
    if (!targetUrl.includes('/')) {
      navigate(`/tldr/${encodeURIComponent(targetUrl)}`);
    } else {
      navigate(`/${targetUrl}`);
    }
  };

  const handleStyleClick = (style: string) => {
    if (isValidUrl) {
      let processableUrl = url;
      if (processableUrl.startsWith('http://')) {
        processableUrl = processableUrl.substring(7);
      } else if (processableUrl.startsWith('https://')) {
        processableUrl = processableUrl.substring(8);
      }
      navigate(`/${style}/${processableUrl}`);
    } else {
      setCustomStyle(style);
      toast({
        title: "Style Selected",
        description: `Will apply "${style}" once you enter a valid URL.`
      });
    }
  };

  return (
    <div className="min-h-screen font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <header className="px-6 py-4 flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm transition-colors">
        <div className="text-2xl font-bold text-slate-900 dark:text-white font-serif flex items-center gap-2">
          <Sparkles className="text-blue-500 w-6 h-6" />
          rewrite.page
        </div>
        <div>
          <ThemeToggle />
        </div>
      </header>

      <section className="w-full max-w-6xl mx-auto px-4 pt-12 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-4 tracking-tight text-slate-900 dark:text-white">
            Transform the Web.
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Paste any article URL. Choose a style. Read it your way.
          </p>
        </div>

        <Card className="max-w-3xl mx-auto shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mb-16 overflow-hidden transition-colors">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Target Article URL</label>
                <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-row gap-3'}`}>
                  <Input
                    type="text"
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={handleInputChange}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 dark:text-white focus:border-blue-500 focus:ring-blue-500 h-12 text-md transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Freeform Modifier (Optional - defaults to TLDR)</label>
                <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-row gap-3'}`}>
                  <Input
                    type="text"
                    placeholder="e.g. French, Academic, Sarcastic..."
                    value={customStyle}
                    onChange={handleStyleChange}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 dark:text-white focus:border-blue-500 focus:ring-blue-500 h-12 text-md transition-all"
                  />
                  <Button
                    type="submit"
                    disabled={!isValidUrl}
                    className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all ${isMobile ? 'w-full h-12' : 'h-12 px-8'} flex items-center justify-center`}
                  >
                    Rewrite
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">Or Pick a Preset Style</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {AVAILABLE_STYLES.map(style => (
              <div
                key={style.id}
                onClick={() => handleStyleClick(style.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 group
                  ${customStyle === style.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 hover:shadow-md hover:-translate-y-1'
                  }`}
              >
                <h3 className={`font-bold mb-1 ${customStyle === style.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                  {style.label}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {style.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </section>
    </div>
  );
};

export default Index;