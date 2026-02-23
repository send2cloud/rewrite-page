const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

export interface Env {
    AI: any;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        let targetUrl = '';
        let style = '';

        if (request.method === 'POST') {
            try {
                const body: any = await request.json();
                targetUrl = body.url;
                style = body.style || 'standard';

                // Strip out localhost:8080 if accidentally included in targetUrl from React frontend extraction
                if (targetUrl && targetUrl.includes('localhost:8080/')) {
                    targetUrl = targetUrl.replace('http://localhost:8080/', '').replace('https://localhost:8080/', '').replace('localhost:8080/', '');
                }
            } catch (e) {
                return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
            }
        } else {
            const url = new URL(request.url);
            const path = url.pathname;
            const parts = path.split('/').filter(Boolean);

            if (parts.length < 2) {
                if (path === '/') {
                    return new Response("Usage for GET: /<language-or-style>/<url>\nOr use POST with JSON { url, style }", { status: 200, headers: corsHeaders });
                }
                return new Response("Invalid URL. Usage: /<language-or-style>/<url>", { status: 400, headers: corsHeaders });
            }
            style = decodeURIComponent(parts[0]);

            let fullUrl = url.pathname.substring(`/${parts[0]}/`.length);
            // Hack for when user accidentally includes localhost:8080 in the url
            if (fullUrl.startsWith('localhost:8080/')) {
                fullUrl = fullUrl.replace('localhost:8080/', '');
            }
            targetUrl = fullUrl;
        }

        if (!targetUrl) {
            return new Response(JSON.stringify({ error: "Missing url" }), { status: 400, headers: corsHeaders });
        }

        let fullUrl = targetUrl;
        if (fullUrl.startsWith('http:/') && !fullUrl.startsWith('http://')) {
            fullUrl = fullUrl.replace('http:/', 'http://');
        } else if (fullUrl.startsWith('https:/') && !fullUrl.startsWith('https://')) {
            fullUrl = fullUrl.replace('https:/', 'https://');
        } else if (!fullUrl.startsWith('http')) {
            fullUrl = `https://${fullUrl}`;
        }

        try {
            const mdUrl = `https://markdown.new/${fullUrl}`;
            console.log("Fetching markdown: " + mdUrl);

            const mdResponse = await fetch(mdUrl);
            if (!mdResponse.ok) {
                return new Response(JSON.stringify({ error: `Failed to fetch markdown from ${mdUrl}. Status: ${mdResponse.status}` }), { status: 200, headers: corsHeaders });
            }

            let content = await mdResponse.text();

            if (content.length > 15000) {
                content = content.substring(0, 15000) + "... [Content truncated]";
            }

            const baseInstruction = "CRITICAL: Output ONLY plain text format. NO markdown. NO formatting. Do NOT include ANY introduction or conclusion. NO phrases. Start DIRECTLY with content. END immediately after content. Use only basic ASCII characters, no unicode, emojis, or special characters.";

            let systemPrompt = "";
            switch (style.toLowerCase()) {
                case 'simple': systemPrompt = `You are a helpful assistant that specializes in simplifying complex content. Rewrite the provided text in simple, easy-to-understand English with short sentences and common words. Avoid jargon and technical terms. ${baseInstruction}`; break;
                case 'bullets': systemPrompt = `You are a helpful assistant. Extract the 5 most important points from content. Present them as numbered items. Make each point concise. ${baseInstruction}`; break;
                case 'eli5': systemPrompt = `You are a helpful assistant that explains complex topics as if to a 5-year-old child. Use ONLY very simple language. Short sentences. Common words. Avoid ANY complex terms. Keep paragraphs to 2-3 simple sentences. ${baseInstruction}`; break;
                case 'joke': systemPrompt = `You are a professional comedian. Summarize the provided content into a highly humorous, witty, and deeply sarcastic joke or set of jokes. Keep the core facts but wrap them in comedy. ${baseInstruction}`; break;
                case 'concise': systemPrompt = `You are a helpful assistant that specializes in creating extremely concise summaries. Distill the content down to its absolute essence in as few words as possible. ${baseInstruction}`; break;
                case 'tweet': systemPrompt = `You are a helpful assistant. Distill the content into exactly 140 characters or less. Be extremely concise while capturing the most essential point. Don't use hashtags. ${baseInstruction}`; break;
                case 'clickbait': systemPrompt = `You are a world-class viral content creator. Turn the provided content into a highly hyperbolic, sensationally dramatic, and absolutely irresistible "clickbait" summary. Make it sound like the most important thing anyone will read today. Keep the core facts but wrap them in pure viral energy. ${baseInstruction}`; break;
                case 'standard': systemPrompt = `You are a helpful assistant. Identify the key information and present it in a plain text format. ${baseInstruction}`; break;
                default:
                    // If it's none of the predefined styles, we treat it as a language translation + standard summary, OR a custom style.
                    systemPrompt = `You are a world-class translator and summarizer. Your task is to extract the key points of the provided content, summarize them clearly, and translate the summary entirely to ${style}. Start directly with the translated text. No preamble. No sign-offs. Just the output text. ${baseInstruction}`;
                    break;
            }
            const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Content:\n\n${content}` }
                ]
            });

            const outText = (aiResponse as any).response || "No response generated";

            if (request.method === 'POST') {
                const jsonResponse = JSON.stringify({
                    originalContent: content,
                    summary: outText
                });
                return new Response(jsonResponse, {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            } else {
                return new Response(outText, {
                    headers: { ...corsHeaders, "Content-Type": "text/plain;charset=UTF-8" }
                });
            }

        } catch (e: any) {
            if (request.method === 'POST') {
                return new Response(JSON.stringify({ error: e.message }), { status: 200, headers: corsHeaders });
            }
            return new Response(`Error: ${e.message}`, { status: 500, headers: corsHeaders });
        }
    }
}
