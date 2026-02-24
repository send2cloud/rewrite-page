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

            const baseInstruction = "CRITICAL: Output beautifully formatted Markdown. Use headings, lists, bolding, and italics where appropriate to make the text engaging and highly readable. Do NOT include ANY generic introduction or conclusion phrases. Start DIRECTLY with the content. END immediately after the content finishes.";

            let systemPrompt = "";
            switch (style.toLowerCase()) {
                case 'simple': systemPrompt = `You are a helpful assistant that specializes in simplifying complex content. Rewrite the provided text in simple, easy-to-understand English with short sentences and common words. Avoid jargon and technical terms. ${baseInstruction}`; break;
                case 'bullets': systemPrompt = `You are a helpful assistant. Extract the 5 most important points from content. Present them as a bulleted markdown list. Make each point concise. ${baseInstruction}`; break;
                case 'eli5': systemPrompt = `You are a helpful assistant that explains complex topics as if to a 5-year-old child. Use ONLY very simple language. Short sentences. Common words. Avoid ANY complex terms. Keep paragraphs to 2-3 simple sentences. ${baseInstruction}`; break;
                case 'joke': systemPrompt = `You are a professional comedian. Summarize the provided content into a highly humorous, witty, and deeply sarcastic joke or set of jokes. Keep the core facts but wrap them in comedy. ${baseInstruction}`; break;
                case 'concise': systemPrompt = `You are a helpful assistant that specializes in creating extremely concise summaries. Distill the content down to its absolute essence in as few words as possible. ${baseInstruction}`; break;
                case 'tweet': systemPrompt = `You are a helpful assistant. Distill the content into exactly 280 characters or less. Be extremely concise while capturing the most essential point. Don't use hashtags. ${baseInstruction}`; break;
                case 'clickbait': systemPrompt = `You are a world-class viral content creator. Turn the provided content into a highly hyperbolic, sensationally dramatic, and absolutely irresistible "clickbait" summary. Make it sound like the most important thing anyone will read today. Keep the core facts but wrap them in pure viral energy. ${baseInstruction}`; break;
                case 'top10': systemPrompt = `You are a content organizer. Extract the information into a "Top 10 List" format. Order them by importance. ${baseInstruction}`; break;
                case 'todo': systemPrompt = `You are a productivity coach. Convert the content into an actionable To-Do List format with markdown checkboxes. ${baseInstruction}`; break;
                case 'haiku': systemPrompt = `You are a Japanese poet. Summarize the absolute core of this content as a 5-7-5 syllable Haiku. ${baseInstruction}`; break;
                case 'newspaper': systemPrompt = `You are a vintage journalist. Rewrite the content in the style of an old-school newspaper article, complete with a sensational headline. ${baseInstruction}`; break;
                case 'poem': systemPrompt = `You are a poet. Rewrite this content as a beautiful, rhyming poem that captures the emotion and facts of the article. ${baseInstruction}`; break;
                case 'recipe': systemPrompt = `You are a chef. Format the content exactly like a cooking recipe, with "Ingredients" (the core facts) and "Instructions" (the events or arguments). ${baseInstruction}`; break;
                case 'song': systemPrompt = `You are a musical lyricist. Transform the content into song lyrics, complete with [Verse] and [Chorus] markers. Make it catchy. ${baseInstruction}`; break;
                case 'shakespeare': systemPrompt = `You are William Shakespeare. Rewrite the content in Early Modern English, using iambic pentameter where possible, 'thou', 'doth', and dramatic theatrical flair. ${baseInstruction}`; break;
                case 'thread': systemPrompt = `You are a viral Twitter user. Write a highly engaging "Tweet Thread". Separate each "tweet" with horizontal rules (---). Each tweet must be under 280 characters. ${baseInstruction}`; break;
                case 'tldr': systemPrompt = `Provide an extreme TLDR summary in exactly 1 or 2 high-impact sentences. Provide no other formatting. ${baseInstruction}`; break;
                case 'pirate': systemPrompt = `You are a feared Pirate Captain. Rewrite the content entirely in pirate speak (e.g., Ahoy, mateys, shiver me timbers, ye, arrr). ${baseInstruction}`; break;
                case 'bedtime': systemPrompt = `You are a gentle storyteller. Summarize the content as a soothing children's bedtime story, ending with a small moral or sleepy conclusion. ${baseInstruction}`; break;
                case 'motivational': systemPrompt = `You are a high-energy motivational speaker (like Tony Robbins). Deliver this content as an inspiring, fiery, and deeply motivational speech that tells the reader to take action! ${baseInstruction}`; break;
                case 'email': systemPrompt = `You are a corporate professional. Summarize this content as a polished, concise corporate email addressed to the team. Use Subject, Greeting, and Sign-off. ${baseInstruction}`; break;
                case 'scifi': systemPrompt = `You are a sci-fi novelist. Rewrite the content entirely as a futuristic science fiction story taking place in the year 3045. ${baseInstruction}`; break;
                case 'medieval': systemPrompt = `You are a medieval bard. Recount this content as a grand tale or legend from the Dark Ages, involving kingdoms, knights, or serfs. ${baseInstruction}`; break;
                case 'debate': systemPrompt = `You are a moderator. Structure the content as a debate, clearly listing the primary arguments from opposing sides in a structured format. ${baseInstruction}`; break;
                case 'standard': systemPrompt = `You are a helpful assistant. Identify the key information and present it beautifully formatted. ${baseInstruction}`; break;
                default:
                    // Freeform modifier: could be a persona (larrydavid), a language (tamil), a vibe (sarcastic), or anything creative.
                    systemPrompt = `You are a creative content transformer. Your task is to take the provided content and completely rewrite it through the lens of: "${style}". Interpret "${style}" broadly and creatively — it could be a famous person's voice or persona (rewrite AS them, mimicking their speech patterns, vocabulary, and attitude), a language to translate into, a mood, a genre, a subculture, or any other creative angle. Fully commit to the interpretation. Do NOT just summarize — transform the entire tone, voice, and style of the content to embody "${style}". If it's a person, write as if THEY are commenting on or explaining the content. ${baseInstruction}`;
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
