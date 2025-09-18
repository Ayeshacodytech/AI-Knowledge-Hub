const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

function createGeminiService(apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    async function summarizeDocument(title, content) {
        try {
            const prompt = `Please provide a concise summary (2-3 sentences) of the following document:

Title: ${title}
Content: ${content}

Summary:`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (err) {
            console.error('Error summarizing document:', err);
            throw new Error('Failed to generate summary');
        }
    }

    async function generateTags(title, content) {
        try {
            const prompt = `Based on the following document, generate 3-5 relevant tags. Return only the tags as a comma-separated list:

Title: ${title}
Content: ${content}

Tags:`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response
                .text()
                .trim()
                .split(',')
                .map(t => t.trim().toLowerCase())
                .slice(0, 5);
        } catch (err) {
            console.error('Error generating tags:', err);
            throw new Error('Failed to generate tags');
        }
    }

    async function generateEmbedding(text) {
        try {
            const result = await embeddingModel.embedContent(text);
            return result.embedding.values;
        } catch (err) {
            console.error('Error generating embedding:', err);
            throw new Error('Failed to generate embedding');
        }
    }

    async function answerQuestion(question, documents) {
        try {
            const context = documents.map(doc =>
                `Title: ${doc.title}\nContent: ${doc.content}\nSummary: ${doc.summary}\n---`
            ).join('\n');

            const prompt = `Based on the following documents from our knowledge base, please answer the user's question. 
If the answer cannot be found in the provided documents, please say so.

DOCUMENTS:
${context}

QUESTION: ${question}

ANSWER:`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error('Error answering question:', error);
            throw new Error('Failed to generate answer');
        }
    }

    function cosineSimilarity(a, b) {
        if (a.length !== b.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        if (normA === 0 || normB === 0) return 0;

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    return { summarizeDocument, generateTags, generateEmbedding, answerQuestion, cosineSimilarity };
}

module.exports = createGeminiService(process.env.GEMINI_API_KEY);
