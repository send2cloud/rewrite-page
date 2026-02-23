import { SummarizationService, SummarizationRequest, SummarizationResponse } from "@/core/summarization/types";
import { createAppError } from "@/utils/errorUtils";

export class CloudflareSummarizationAdapter implements SummarizationService {
    private readonly apiUrl = import.meta.env.VITE_API_URL
        || (typeof window !== 'undefined' && window.location.hostname === 'localhost'
            ? 'http://localhost:8787'
            : 'https://distill-v2.send2cloud.workers.dev');

    async process(params: SummarizationRequest): Promise<SummarizationResponse> {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            });

            const data = await response.json() as any;

            if (data.error) {
                throw createAppError(data.error, (data.errorCode || "PROCESSING_ERROR") as any);
            }

            return {
                summary: data.summary,
                originalContent: data.originalContent
            };
        } catch (error: any) {
            console.error('Error in CloudflareSummarizationAdapter:', error);
            throw error;
        }
    }
}
