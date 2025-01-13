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
                1. There is no error in the code and the reviewer approved it.
                2. There are some errors in the code and the reviewer identified only partial of the errors.
                3. The reviewer identified all the errors in the code.
                4. There are errors in the code but the reviewer approved it.
                5. There are no errors in the code and the reviewer approved it.

                Here are the identified errors:
                ${errors}

                Here are the reviewer's comments:
                ${comments}

                Please classify the reviewer's work into one of the above categories. Just explain the reviewer's work in one line based on the above 5 buckets.

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
