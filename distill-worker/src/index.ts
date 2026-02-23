// distill-worker/src/index.ts

export interface Env {
    OPENROUTER_API_KEY: string;
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // Basic bot protection: Ensure request comes from a browser (has Origin or Referer)
            const origin = request.headers.get('Origin') || '';
            const referer = request.headers.get('Referer') || '';
            const userAgent = request.headers.get('User-Agent') || '';

            // Reject requests missing typical browser headers (simple script kiddie block)
            if (!userAgent || userAgent.includes('curl') || userAgent.includes('python-requests')) {
                throw new Error("Blocked: suspicious request pattern");
            }

            if (request.method !== 'POST') {
                throw new Error(`Method ${request.method} not allowed, please use POST`);
            }

            const requestData = await request.json<any>().catch(e => {
                throw new Error("Invalid JSON in request body");
            });

            const { url, content, style, bulletCount, model } = requestData;

            if (!url && !content) {
                throw new Error("Either URL or content parameter is required");
            }

            let result;
            if (url) {
                result = await processUrl(url, style || 'standard', bulletCount, model, env.OPENROUTER_API_KEY);
            } else if (content) {
                result = await processDirectContent(content, style || 'standard', bulletCount, model, env.OPENROUTER_API_KEY);
            }

            return new Response(
                JSON.stringify(result),
                {
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error: any) {
            console.error("Error in worker:", error);

            let userMessage = error.message || "An unknown error occurred";
            let errorCode = "PROCESSING_ERROR";

            if (userMessage.includes("URL")) {
                errorCode = "URL_ERROR";
            } else if (userMessage.includes("fetch") || userMessage.includes("connection") || userMessage.includes("timed out")) {
                errorCode = "CONNECTION_ERROR";
            } else if (userMessage.includes("content") || userMessage.includes("extract")) {
                errorCode = "CONTENT_ERROR";
            } else if (userMessage.includes("API") || userMessage.includes("quota") || userMessage.includes("rate limit")) {
                errorCode = "AI_SERVICE_ERROR";
            }

            return new Response(
                JSON.stringify({
                    error: userMessage,
                    errorCode: errorCode,
                    originalContent: "",
                    summary: ""
                }),
                {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json'
                    }
                }
            );
        }
    }
};

async function processUrl(
    url: string,
    style: string,
    bulletCount?: number,
    model: string = "openai/gpt-5-nano",
    apiKey: string = ""
) {
    let fullUrl = url.trim();
    if (!fullUrl) throw new Error("URL is empty");
    if (!fullUrl.startsWith('http')) fullUrl = `http://${fullUrl}`;

    console.log(`Processing URL: ${fullUrl}`);

    let content = "";
    let usedFallback = false;

    try {
        const jinaProxyUrl = `https://r.jina.ai/${fullUrl}`;
        content = await fetchContent(jinaProxyUrl, true);
        console.log(`Jina fetch success, content length: ${content.length}`);
    } catch (e: any) {
        console.warn(`Jina fetch failed: ${e.message}. Trying direct fetch fallback...`);
        usedFallback = true;
        content = await fetchContent(fullUrl, false);
        console.log(`Direct fetch success, raw length: ${content.length}`);
        content = cleanRawHTML(content);
        console.log(`Cleaned HTML length: ${content.length}`);
    }

    if (!content || content.trim() === '') {
        throw new Error("Content was empty after fetching. The website may use techniques that prevent content extraction.");
    }

    // Truncate very long content to avoid context limits (approx 15k chars)
    if (content.length > 25000) {
        content = content.substring(0, 25000) + "... [Content truncated for summary]";
    }

    const summary = await summarizeContent(content, style, bulletCount, model, apiKey, usedFallback);

    return {
        originalContent: content,
        summary: summary,
        fallback: usedFallback
    };
}

function cleanRawHTML(html: string): string {
    // Basic cleaning to keep it token-efficient for LLM
    let text = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
        .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return text;
}

async function processDirectContent(
    content: string,
    style: string,
    bulletCount?: number,
    model: string = "openai/gpt-5-nano",
    apiKey: string = ""
) {
    const summary = await summarizeContent(content, style || 'standard', bulletCount, model, apiKey);
    return {
        originalContent: content,
        summary: summary
    };
}

async function fetchContent(url: string, isJina: boolean = false): Promise<string> {
    const maxRetries = isJina ? 1 : 0;
    let retries = 0;

    while (retries <= maxRetries) {
        const controller = new AbortController();
        const timeoutMs = isJina ? 10000 : 15000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; DistillApp/1.0; +https://distill.app)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 429 && retries < maxRetries) {
                    retries++;
                    await new Promise(resolve => setTimeout(resolve, 2000 * retries));
                    continue;
                }

                const errorText = await response.text();
                if (response.status === 403 || response.status === 401) {
                    throw new Error(`Access denied. The website may be blocking our requests. Status: ${response.status}. Details: ${errorText.substring(0, 50)}`);
                } else if (response.status === 404) {
                    throw new Error(`Page not found. Please check that the URL is correct.`);
                } else if (response.status >= 500) {
                    throw new Error(`Website server error. The target website is experiencing issues. Status: ${response.status}`);
                } else {
                    throw new Error(`Failed to fetch content. Status: ${response.status} ${response.statusText}`);
                }
            }

            const content = await response.text();
            if (!content || content.trim() === '') {
                throw new Error("Received empty content from URL.");
            }
            return content;
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (retries < maxRetries && (error.name === 'AbortError' || error.message.includes('fetch'))) {
                retries++;
                await new Promise(resolve => setTimeout(resolve, 1000 * retries));
                continue;
            }
            if (error.name === 'AbortError') {
                throw new Error("Request timed out after 15 seconds.");
            }
            throw error;
        }
    }
    throw new Error("Failed to fetch content after retries");
}

async function summarizeContent(
    content: string,
    style: string,
    bulletCount?: number,
    model: string = "openai/gpt-5-nano",
    apiKey: string = "",
    isFallback: boolean = false
): Promise<string> {
    if (!content || content.trim().length < 100) {
        throw new Error("Content is too short to summarize meaningfully (less than 100 characters)");
    }

    let retries = 0;
    const maxRetries = 2; // Increased retries

    const userMessage = isFallback
        ? `The following content is extracted from raw HTML. It may contain navigation elements, ads, or boilerplates. Please focus ONLY on the primary article/blog content and summarize it according to the style specified in my system message. Remember: Start directly with content. No preamble. No postamble. PLAIN TEXT ONLY - NO MARKDOWN.\n\n${content}`
        : `Summarize the following content according to the style specified in my system message. Remember: Start directly with content. No preamble. No postamble. PLAIN TEXT ONLY - NO MARKDOWN.\n\n${content}`;

    while (retries <= maxRetries) {
        // Use a fallback model on the last retry if gpt-5-nano is failing
        const currentModel = (retries === maxRetries && model === "openai/gpt-5-nano")
            ? "google/gemini-2.0-flash-lite:free"
            : model;

        try {
            console.log(`AI Attempt ${retries + 1} using model: ${currentModel}`);
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": "https://distill.app",
                    "X-Title": "Distill"
                },
                body: JSON.stringify({
                    model: currentModel,
                    messages: [
                        { role: "system", content: getPrompt(style, bulletCount) },
                        { role: "user", content: userMessage }
                    ],
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `API error (${response.status}: ${response.statusText})`;
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.error?.message) {
                        errorMessage = errorData.error.message;
                    }
                } catch (e) { }

                if (retries < maxRetries) {
                    retries++;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json<any>();
            const message = data.choices?.[0]?.message;

            // For reasoning models like GPT-4o-extra or GPT-5, content might be in content OR reasoning field
            // especially if it's a 'thinking' model on OpenRouter.
            let summary = message?.content || "";
            if (!summary || summary.trim() === "") {
                summary = message?.reasoning || "";
            }

            console.log(`AI response received. Finish reason: ${data.choices?.[0]?.finish_reason}. Length: ${summary.length}`);

            if (!summary || summary.trim().length < 10) {
                console.error("No summary in response data:", JSON.stringify(data).substring(0, 1000));

                // If this was the first try and it's gpt-5-nano, maybe try a fallback model?
                if (retries < maxRetries) {
                    retries++;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }
                throw new Error("Empty or too short response from AI model");
            }

            const cleanedSummary = extractContentBetweenMarkers(summary);
            if (!cleanedSummary || cleanedSummary.trim().length < 10) {
                throw new Error("Failed to generate a meaningful summary");
            }
            return cleanedSummary.replace(/\s+/g, ' ').trim();
        } catch (error) {
            if (retries < maxRetries) {
                retries++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                throw error;
            }
        }
    }
    throw new Error("Failed to generate summary after retries");
}

function getPrompt(style: string, bulletCount?: number): string {
    const baseInstruction = "CRITICAL: Output ONLY plain text format. NO markdown. NO formatting. Do NOT include ANY introduction or conclusion. NO phrases like 'here's a summary', 'in summary', or 'here are the key points'. NO sign-offs like 'let me know if you need more information'. Start DIRECTLY with content. END immediately after content. Use only basic ASCII characters, no unicode, emojis, or special characters. Format your output with a ### START ### tag at the beginning and ### END ### tag at the end.";

    switch (style.toLowerCase()) {
        case 'simple': return `You are a helpful assistant that specializes in simplifying complex content. Your task is to rewrite the provided text in simple, easy-to-understand English with short sentences and common words. Avoid jargon and technical terms when possible. ${baseInstruction}`;
        case 'bullets': return `You are a helpful assistant that specializes in extracting the ${bulletCount || 5} most important points from content. Your task is to identify only the ${bulletCount || 5} key takeaways. Present them as numbered items (ex: 1. Point one). Make each point concise and informative. Do not use any special characters or formatting. ${baseInstruction}`;
        case 'eli5': return `You are a helpful assistant that explains complex topics as if to a 5-year-old child. Use ONLY very simple language. Short sentences. Common words. Avoid ANY complex terms. Keep paragraphs to 2-3 simple sentences. Pretend the audience knows nothing about the topic. ${baseInstruction}`;
        case 'concise': return `You are a helpful assistant that specializes in creating extremely concise summaries. Your task is to distill the content down to its absolute essence in as few words as possible while retaining all key information. Use short sentences and be very economical with language. ${baseInstruction}`;
        case 'tweet': return `You are a helpful assistant that specializes in creating tweet-sized summaries. Your task is to distill the content into exactly 140 characters or less. Be extremely concise while capturing the most essential point. Don't use hashtags. ${baseInstruction}`;
        case 'clickbait': return `You are a world-class viral content creator. Your task is to turn the provided content into a highly hyperbolic, sensationally dramatic, and absolutely irresistible "clickbait" summary. Use words like "SHOCKING," "YOU WON'T BELIEVE," "SECRET," "INSANE," and "REVEALED." Make it sound like the most important thing anyone will read today. Keep the core facts but wrap them in pure viral energy. ${baseInstruction}`;
        case 'standard': return `You are a helpful assistant that specializes in distilling complex content into concise and clear summaries. Your task is to identify the key information and present it in a plain text format. If content contains rankings or lists (like top 10), format them as proper numbered items. ${baseInstruction}`;
        default:
            if (style && style !== 'standard') {
                return `You are a helpful assistant that specializes in creating summaries tailored to specific styles or perspectives. The user has requested a summary in the style of "${style}". Use your understanding of this style modifier to adapt your approach. For example, if it's a language or cultural reference (like "tamil" or "spanish"), adapt to that cultural or linguistic context. If it's a writing style (like "clickbait" or "academic"), adapt the tone and format accordingly. If it's a bias or perspective (like "leftbias" or "rightbias"), present the content from that perspective while making it clear you're following a style instruction. If it's a business format (like "executivesummary"), follow established conventions for that format. If you don't understand the style, default to a clear, concise summary. ${baseInstruction}`;
            }
            return `You are a helpful assistant that specializes in distilling complex content into concise and clear summaries. Your task is to identify the key information and present it in a plain text format. If content contains rankings or lists (like top 10), format them as proper numbered items. ${baseInstruction}`;
    }
}

function extractContentBetweenMarkers(text: string): string {
    if (!text) return '';
    let cleaned = text.trim();

    // Check for explicit markers first
    const startTag = "### START ###";
    const endTag = "### END ###";

    const startIndex = cleaned.indexOf(startTag);
    const endIndex = cleaned.lastIndexOf(endTag);

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        cleaned = cleaned.substring(startIndex + startTag.length, endIndex).trim();
    } else if (startIndex !== -1) {
        cleaned = cleaned.substring(startIndex + startTag.length).trim();
    }

    cleaned = cleaned
        .replace(/^(Here is|I've created|Below is|This is|The following is|Here's)[^]*?:/i, '')
        .replace(/^(\*\*|\*|#|##|###)\s*[a-zA-Z\s]+(Summary|Content|Text|Analysis)(\*\*|\*|#|##|###)/i, '')
        .replace(/(\*\*|\*|#|##|###)\s*(End|Conclusion|Summary|That's it)([^]*?)$/i, '')
        .trim();
    return cleaned || text;
}
