const express = require('express');
const Document = require('../models/Document');
const { auth } = require('../middleware/Auth');
const { summarizeDocument, generateTags, generateEmbedding, answerQuestion, cosineSimilarity} = require('../services/geminiService');

const router = express.Router();

// Team Q&A - Ask questions about documents
router.post('/qa', auth, async (req, res) => {
    try {
        const { question, includeDeleted = false } = req.body;

        if (!question) {
            return res.status(400).json({ message: 'Question is required' });
        }

        // Get all documents for context
        const searchQuery = includeDeleted ? {} : { isDeleted: false };
        const documents = await Document.find(searchQuery)
            .select('title content summary tags')
            .limit(20) // Limit context to avoid token limits
            .sort({ updatedAt: -1 });

        if (documents.length === 0) {
            return res.json({
                question,
                answer: "I don't have access to any documents to answer your question. Please create some documents first.",
                documentsUsed: 0
            });
        }

        // Get answer from Gemini
        const answer = await answerQuestion(question, documents);

        // Find most relevant documents for this question (optional enhancement)
        let relevantDocs = [];
        try {
            const questionEmbedding = await generateEmbedding(question);

            const docsWithEmbeddings = await Document.find({
                ...searchQuery,
                embedding: { $exists: true, $ne: [] }
            })
                .select('title summary tags embedding')
                .limit(10);

            relevantDocs = docsWithEmbeddings
                .map(doc => ({
                    id: doc._id,
                    title: doc.title,
                    summary: doc.summary,
                    similarity: cosineSimilarity(questionEmbedding, doc.embedding)
                }))
                .filter(doc => doc.similarity > 0.3)
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 3);
        } catch (embError) {
            console.error('Error finding relevant docs:', embError);
        }

        res.json({
            question,
            answer,
            documentsUsed: documents.length,
            relevantDocuments: relevantDocs,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Q&A error:', error);
        res.status(500).json({ message: 'Failed to generate answer' });
    }
});

// Batch summarize multiple documents
router.post('/batch-summarize', auth, async (req, res) => {
    try {
        const { documentIds } = req.body;

        if (!documentIds || !Array.isArray(documentIds)) {
            return res.status(400).json({ message: 'Document IDs array is required' });
        }

        const documents = await Document.find({
            _id: { $in: documentIds },
            isDeleted: false
        });

        const results = [];
        const errors = [];

        for (const doc of documents) {
            try {
                // Only summarize if no summary exists or user wants to regenerate
                if (!doc.summary) {
                    const summary = await summarizeDocument(doc.title, doc.content);
                    doc.summary = summary;
                    doc.lastEditedBy = req.user._id;

                    // Update embedding
                    const embeddingText = `${doc.title} ${doc.content} ${summary}`;
                    doc.embedding = await generateEmbedding(embeddingText);

                    await doc.save();

                    results.push({
                        documentId: doc._id,
                        title: doc.title,
                        summary,
                        status: 'success'
                    });
                } else {
                    results.push({
                        documentId: doc._id,
                        title: doc.title,
                        summary: doc.summary,
                        status: 'already_exists'
                    });
                }
            } catch (error) {
                errors.push({
                    documentId: doc._id,
                    title: doc.title,
                    error: error.message
                });
            }
        }

        res.json({
            message: 'Batch summarization completed',
            successful: results.length,
            errors: errors.length,
            results,
            errors
        });
    } catch (error) {
        console.error('Batch summarize error:', error);
        res.status(500).json({ message: 'Batch summarization failed' });
    }
});

// Batch generate tags for multiple documents
router.post('/batch-tags', auth, async (req, res) => {
    try {
        const { documentIds } = req.body;

        if (!documentIds || !Array.isArray(documentIds)) {
            return res.status(400).json({ message: 'Document IDs array is required' });
        }

        const documents = await Document.find({
            _id: { $in: documentIds },
            isDeleted: false
        });

        const results = [];
        const errors = [];

        for (const doc of documents) {
            try {
                // Only generate tags if none exist or user wants to regenerate
                if (!doc.tags || doc.tags.length === 0) {
                    const tags = await generateTags(doc.title, doc.content);
                    doc.tags = tags;
                    doc.lastEditedBy = req.user._id;
                    await doc.save();

                    results.push({
                        documentId: doc._id,
                        title: doc.title,
                        tags,
                        status: 'success'
                    });
                } else {
                    results.push({
                        documentId: doc._id,
                        title: doc.title,
                        tags: doc.tags,
                        status: 'already_exists'
                    });
                }
            } catch (error) {
                errors.push({
                    documentId: doc._id,
                    title: doc.title,
                    error: error.message
                });
            }
        }

        res.json({
            message: 'Batch tag generation completed',
            successful: results.length,
            errors: errors.length,
            results,
            errors
        });
    } catch (error) {
        console.error('Batch tags error:', error);
        res.status(500).json({ message: 'Batch tag generation failed' });
    }
});

// Get AI usage statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const totalDocs = await Document.countDocuments({ isDeleted: false });
        const docsWithSummary = await Document.countDocuments({
            isDeleted: false,
            summary: { $exists: true, $ne: '' }
        });
        const docsWithTags = await Document.countDocuments({
            isDeleted: false,
            tags: { $exists: true, $not: { $size: 0 } }
        });
        const docsWithEmbeddings = await Document.countDocuments({
            isDeleted: false,
            embedding: { $exists: true, $not: { $size: 0 } }
        });

        // Get most common tags
        const topTags = await Document.aggregate([
            { $match: { isDeleted: false } },
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            totalDocuments: totalDocs,
            documentsWithSummary: docsWithSummary,
            documentsWithTags: docsWithTags,
            documentsWithEmbeddings: docsWithEmbeddings,
            aiCoveragePercentage: {
                summaries: totalDocs > 0 ? Math.round((docsWithSummary / totalDocs) * 100) : 0,
                tags: totalDocs > 0 ? Math.round((docsWithTags / totalDocs) * 100) : 0,
                embeddings: totalDocs > 0 ? Math.round((docsWithEmbeddings / totalDocs) * 100) : 0
            },
            topTags: topTags.map(tag => ({
                name: tag._id,
                count: tag.count
            }))
        });
    } catch (error) {
        console.error('AI stats error:', error);
        res.status(500).json({ message: 'Failed to get AI statistics' });
    }
});

module.exports = router;