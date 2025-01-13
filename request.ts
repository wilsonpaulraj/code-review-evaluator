export async function identifyCodeErrors(prompt: string) {
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
                prompt: prompt.substring(0, 50) + '...'
            });

            const fullPrompt = `
              You are a code analysis expert. You are given a code snippet. Analyze the code and identify any errors.
              Provide only the error name and the line number where the error occurred. If there are no errors, then return No Errors.

              Code Snippet:
              ${prompt}

              Format:
              <line_number>: <error_name>: <error_description>
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

            const data = await response.json();
            console.log('API response received:', data);

            const generatedErrors = data.candidates[0].content.parts[0].text;
            console.log("Generated Errors:\n", generatedErrors);
            return generatedErrors;

        } catch (error) {
            console.error('Error in API request:', {
                error: (error as Error).message,
                retry: retries + 1,
                maxRetries: MAX_RETRIES
            });

            retries++;
            if (retries === MAX_RETRIES || !(error as any).message.includes('429')) {
                throw error;
            }
        }
    }
}

export async function getCodeErrors(prompt: string, setErrors: (errors: string) => void) {
    const errors = await identifyCodeErrors(prompt);
    console.log("Errors: ", errors);
    setErrors(errors);
}
