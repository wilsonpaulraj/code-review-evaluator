interface ClassificationResponse {
    candidates: {
        content: {
            parts: {
                text: string;
            }[];
        };
    }[];
}

export async function classifyReviewerPerformance(errors: string, comments: string): Promise<string | undefined> {
    const API_KEY = 'AIzaSyB8Ha0uHwNqFfVoD9iAjCQbH4Yb9rbGSO8';
    const RATE_LIMIT_DELAY = 1000;
    let lastRequestTime = 0;

    const MAX_RETRIES = 3;
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            console.log(`Attempt ${retries + 1} of ${MAX_RETRIES}`);

            if (retries > 0) {
                const backoffDelay = RATE_LIMIT_DELAY * Math.pow(2, retries);
                console.log(`Retry backoff: waiting ${backoffDelay}ms`);
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
            }

            const now = Date.now();
            const timeSinceLastRequest = now - lastRequestTime;
            if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
                const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
                console.log(`Rate limit: waiting ${waitTime}ms`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
            lastRequestTime = Date.now();

            console.log('Making API request...', {
                timestamp: new Date().toISOString(),
                errors: errors.substring(0, 50) + '...',
                comments: comments.substring(0, 50) + '...'
            });

            const fullPrompt = `
                You are a code review evaluation expert. You have been provided with the errors identified in a code snippet and the reviewer's comments. Your task is to evaluate whether the reviewer identified the errors correctly and classify their performance into one of the following buckets:
                1. No Errors, Correct Approval: The code has no errors, and the reviewer correctly approved it.
                2. Partial Error Identification: The code contains some errors, but the reviewer identified only a portion of them.
                3. Full Error Identification: The code contains errors, and the reviewer correctly identified all of them.
                4. Errors Missed, Incorrect Approval: The code contains errors, but the reviewer failed to identify them and approved the code.
                5. False Error Identification: The code has no errors, but the reviewer incorrectly identified issues.

                Here are the identified errors:
                ${errors}

                Here are the reviewer's comments:
                ${comments}

                Please analyze the reviewer's comments based on the provided errors and classify their performance into one of the above categories. Provide a one-line explanation of the classification.

            `;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: fullPrompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data: ClassificationResponse = await response.json();
            console.log('API response received:', data);

            const classificationResult = data.candidates[0].content.parts[0].text.trim();
            console.log("Classification Result: ", classificationResult);
            return classificationResult;

        } catch (error) {
            console.error('Error in API request:', {
                error: (error as Error).message,
                retry: retries + 1,
                maxRetries: MAX_RETRIES
            });

            retries++;
            if (retries === MAX_RETRIES || !(error as any).message.includes('429')) {
                return undefined;
            }
        }
    }
}

interface GetReviewerClassificationParams {
    errors: string;
    comments: string;
    setClassification: (classification: string | undefined) => void;
}

export async function getReviewerClassification({ errors, comments, setClassification }: GetReviewerClassificationParams): Promise<void> {
    const classification = await classifyReviewerPerformance(errors, comments);
    console.log("Reviewer Classification: ", classification);
    setClassification(classification);
}
