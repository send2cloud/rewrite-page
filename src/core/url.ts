export function normalizeUrl(rawUrl: string): string {
    const processedUrl = rawUrl.trim();

    if (!processedUrl) {
        throw new Error("URL is empty");
    }

    const hasProtocol = processedUrl.match(/^[a-zA-Z]+:\/\//);
    return hasProtocol ? processedUrl : `https://${processedUrl}`;
}

export function validateUrl(input: string): boolean {
    try {
        const urlToCheck = input.startsWith('http') ? input : `http://${input}`;
        new URL(urlToCheck);
        return true;
    } catch {
        return false;
    }
}

export function stripProtocol(url: string): string {
    return url.replace(/^https?:\/\//, '');
}
