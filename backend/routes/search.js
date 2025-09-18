const express = require('express');
const Document = require('../models/Document');
const { auth } = require('../middleware/Auth');
const geminiService = require('../services/geminiService');

const router = express.Router();

// Text search
router.get('/text', auth, async (req, res) => {
    try {
        const { query, tags, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        let searchQuery = { isDeleted: false };

        // Add text search
        if (query) {
            searchQuery.$text = { $search: query };
        }

        // Add tag filter
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            searchQuery.tags = { $in: tagArray };
        }

        const documents = await Document.find(searchQuery)
            .populate('createdBy', 'name email')
            .populate('lastEditedBy', 'name email')
            .sort(query ? { score: { $meta: 'textScore' } } : { updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Document.countDocuments(searchQuery);

        res.json({
            documents,
            query,
            tags: tags ? tags.split(',') : [],
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Text search error:', error);
        res.status(500).json({ message: 'Search failed' });
    }
});

// Semantic search
router.get('/semantic', auth, async (req, res) => {
    try {
        const { query, limit = 10, threshold = 0.3 } = req.query;

        if (!query) {
            return res.status(400).json({ message: 'Query is required' });
        }

        // Generate embedding for the search query
        const queryEmbedding = await geminiService.generateEmbedding(query);

        // Get all documents with embeddings
        const documents = await Document.find({
            isDeleted: false,
            embedding: { $exists: true, $ne: [] }
        })
            .populate('createdBy', 'name email')
            .populate('lastEditedBy', 'name email');

        // Calculate similarities and sort
        const documentsWithSimilarity = documents.map(doc => ({
            ...doc.toObject(),
            similarity: geminiService.cosineSimilarity(queryEmbedding, doc.embedding)
        }))
            .filter(doc => doc.similarity >= threshold)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, parseInt(limit));

        res.json({
            documents: documentsWithSimilarity,
            query,
            threshold: parseFloat(threshold),
            count: documentsWithSimilarity.length
        });
    } catch (error) {
        console.error('Semantic search error:', error);
        res.status(500).json({ message: 'Semantic search failed' });
    }
});

// Get all unique tags
router.get('/tags', auth, async (req, res) => {
    try {
        const tags = await Document.aggregate([
            { $match: { isDeleted: false } },
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 50 }
        ]);

        const tagList = tags.map(tag => ({
            name: tag._id,
            count: tag.count
        }));

        res.json({ tags: tagList });
    } catch (error) {
        console.error('Get tags error:', error);
        res.status(500).json({ message: 'Failed to get tags' });
    }
});

// Advanced search with multiple filters
router.post('/advanced', auth, async (req, res) => {
    try {
        const {
            query,
            tags,
            author,
            dateFrom,
            dateTo,
            searchType = 'text',
            page = 1,
            limit = 10
        } = req.body;

        const skip = (page - 1) * limit;

        if (searchType === 'semantic' && query) {
            // Semantic search with filters
            const queryEmbedding = await geminiService.generateEmbedding(query);

            let matchQuery = { isDeleted: false, embedding: { $exists: true, $ne: [] } };

            // Add filters
            if (tags && tags.length > 0) {
                matchQuery.tags = { $in: tags };
            }

            if (author) {
                matchQuery.createdBy = author;
            }

            if (dateFrom || dateTo) {
                matchQuery.createdAt = {};
                if (dateFrom) matchQuery.createdAt.$gte = new Date(dateFrom);
                if (dateTo) matchQuery.createdAt.$lte = new Date(dateTo);
            }

            const documents = await Document.find(matchQuery)
                .populate('createdBy', 'name email')
                .populate('lastEditedBy', 'name email');

            const documentsWithSimilarity = documents.map(doc => ({
                ...doc.toObject(),
                similarity: geminiService.cosineSimilarity(queryEmbedding, doc.embedding)
            }))
                .filter(doc => doc.similarity >= 0.3)
                .sort((a, b) => b.similarity - a.similarity)
                .slice(skip, skip + parseInt(limit));

            const total = documents.filter(doc =>
                geminiService.cosineSimilarity(queryEmbedding, doc.embedding) >= 0.3
            ).length;

            res.json({
                documents: documentsWithSimilarity,
                searchType: 'semantic',
                filters: { query, tags, author, dateFrom, dateTo },
                pagination: {
                    current: parseInt(page),
                    total: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            });
        } else {
            // Text search with filters
            let searchQuery = { isDeleted: false };

            if (query) {
                searchQuery.$text = { $search: query };
            }

            if (tags && tags.length > 0) {
                searchQuery.tags = { $in: tags };
            }

            if (author) {
                searchQuery.createdBy = author;
            }

            if (dateFrom || dateTo) {
                searchQuery.createdAt = {};
                if (dateFrom) searchQuery.createdAt.$gte = new Date(dateFrom);
                if (dateTo) searchQuery.createdAt.$lte = new Date(dateTo);
            }

            const documents = await Document.find(searchQuery)
                .populate('createdBy', 'name email')
                .populate('lastEditedBy', 'name email')
                .sort(query ? { score: { $meta: 'textScore' } } : { updatedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Document.countDocuments(searchQuery);

            res.json({
                documents,
                searchType: 'text',
                filters: { query, tags, author, dateFrom, dateTo },
                pagination: {
                    current: parseInt(page),
                    total: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            });
        }
    } catch (error) {
        console.error('Advanced search error:', error);
        res.status(500).json({ message: 'Advanced search failed' });
    }
});

// Get search suggestions based on document titles and tags
router.get('/suggestions', auth, async (req, res) => {
    try {
        const { query, limit = 10 } = req.query;

        if (!query || query.length < 2) {
            return res.json({ suggestions: [] });
        }
        const titleSuggestions = await Document.find({
            isDeleted: false,
            title: { $regex: query, $options: 'i' }
        })
            .select('title')
            .limit(parseInt(limit) / 2);
        const tagSuggestions = await Document.aggregate([
            { $match: { isDeleted: false } },
            { $unwind: '$tags' },
            { $match: { tags: { $regex: query, $options: 'i' } } },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: parseInt(limit) / 2 }
        ]);

        const suggestions = [
            ...titleSuggestions.map(doc => ({ type: 'title', value: doc.title })),
            ...tagSuggestions.map(tag => ({ type: 'tag', value: tag._id, count: tag.count }))
        ];

        res.json({ suggestions });
    } catch (error) {
        console.error('Search suggestions error:', error);
        res.status(500).json({ message: 'Failed to get suggestions' });
    }
});
router.get('/analytics', auth, async (req, res) => {
    try {
        const totalDocs = await Document.countDocuments({ isDeleted: false });
        const popularTags = await Document.aggregate([
            { $match: { isDeleted: false } },
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]);
        const currentDate = new Date();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(currentDate.getMonth() - 12);

        const docsByMonth = await Document.aggregate([
            {
                $match: {
                    isDeleted: false,
                    createdAt: { $gte: twelveMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
        const topAuthors = await Document.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: '$createdBy',
                    documentCount: { $sum: 1 },
                    lastActive: { $max: '$updatedAt' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            { $unwind: '$author' },
            {
                $project: {
                    name: '$author.name',
                    email: '$author.email',
                    documentCount: 1,
                    lastActive: 1
                }
            },
            { $sort: { documentCount: -1 } },
            { $limit: 10 }
        ]);

        // Search performance metrics
        const docsWithEmbeddings = await Document.countDocuments({
            isDeleted: false,
            embedding: { $exists: true, $not: { $size: 0 } }
        });

        const docsWithSummaries = await Document.countDocuments({
            isDeleted: false,
            summary: { $exists: true, $ne: '' }
        });

        const docsWithTags = await Document.countDocuments({
            isDeleted: false,
            tags: { $exists: true, $not: { $size: 0 } }
        });

        res.json({
            overview: {
                totalDocuments: totalDocs,
                documentsWithEmbeddings: docsWithEmbeddings,
                documentsWithSummaries: docsWithSummaries,
                documentsWithTags: docsWithTags,
                embeddingCoverage: totalDocs > 0 ? Math.round((docsWithEmbeddings / totalDocs) * 100) : 0,
                summaryCoverage: totalDocs > 0 ? Math.round((docsWithSummaries / totalDocs) * 100) : 0,
                tagCoverage: totalDocs > 0 ? Math.round((docsWithTags / totalDocs) * 100) : 0
            },
            popularTags: popularTags.map(tag => ({
                name: tag._id,
                count: tag.count,
                percentage: totalDocs > 0 ? Math.round((tag.count / totalDocs) * 100) : 0
            })),
            documentsByMonth: docsByMonth.map(item => ({
                year: item._id.year,
                month: item._id.month,
                count: item.count,
                date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`
            })),
            topAuthors
        });
    } catch (error) {
        console.error('Search analytics error:', error);
        res.status(500).json({ message: 'Failed to get analytics' });
    }
});
router.get('/similar/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 5 } = req.query;

        // Get the reference document
        const refDocument = await Document.findOne({
            _id: id,
            isDeleted: false,
            embedding: { $exists: true, $not: { $size: 0 } }
        });

        if (!refDocument) {
            return res.status(404).json({ message: 'Document not found or no embedding available' });
        }

        // Get all other documents with embeddings
        const otherDocuments = await Document.find({
            _id: { $ne: id },
            isDeleted: false,
            embedding: { $exists: true, $not: { $size: 0 } }
        })
            .populate('createdBy', 'name email')
            .select('title summary tags createdBy createdAt embedding');

        // Calculate similarities and sort
        const similarDocuments = otherDocuments.map(doc => ({
            ...doc.toObject(),
            similarity: geminiService.cosineSimilarity(refDocument.embedding, doc.embedding)
        }))
            .filter(doc => doc.similarity > 0.1)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, parseInt(limit))
            .map(doc => {
                const { embedding, ...docWithoutEmbedding } = doc;
                return docWithoutEmbedding;
            });

        res.json({
            referenceDocument: {
                id: refDocument._id,
                title: refDocument.title
            },
            similarDocuments,
            count: similarDocuments.length
        });
    } catch (error) {
        console.error('Similar documents error:', error);
        res.status(500).json({ message: 'Failed to find similar documents' });
    }
});
router.get('/highlight', auth, async (req, res) => {
    try {
        const { query, limit = 10, page = 1 } = req.query;

        if (!query) {
            return res.status(400).json({ message: 'Query parameter is required' });
        }

        const skip = (page - 1) * limit;

        // Perform text search
        const documents = await Document.find({
            isDeleted: false,
            $text: { $search: query }
        })
            .populate('createdBy', 'name email')
            .sort({ score: { $meta: 'textScore' } })
            .skip(skip)
            .limit(parseInt(limit));
        const highlightedDocuments = documents.map(doc => {
            const searchRegex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

            const highlightedTitle = doc.title.replace(searchRegex, '<mark>$1</mark>');
            const contentSnippet = doc.content.substring(0, 300);
            const highlightedContent = contentSnippet.replace(searchRegex, '<mark>$1</mark>');
            const highlightedSummary = doc.summary
                ? doc.summary.replace(searchRegex, '<mark>$1</mark>')
                : '';

            return {
                ...doc.toObject(),
                highlighted: {
                    title: highlightedTitle,
                    content: highlightedContent + (doc.content.length > 300 ? '...' : ''),
                    summary: highlightedSummary
                },
                score: doc._doc.score || 0
            };
        });

        const total = await Document.countDocuments({
            isDeleted: false,
            $text: { $search: query }
        });

        res.json({
            documents: highlightedDocuments,
            query,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            },
            totalResults: total
        });
    } catch (error) {
        console.error('Highlighted search error:', error);
        res.status(500).json({ message: 'Highlighted search failed' });
    }
});

module.exports = router;
