const express = require('express');
const Document = require('../models/Document');
const { auth, ownerOrAdminAuth } = require('../middleware/Auth');
const {
    summarizeDocument,
    generateTags,
    generateEmbedding
} = require('../services/geminiService');

const router = express.Router();

// Get all documents (with pagination)
router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const documents = await Document.find({ isDeleted: false })
            .populate('createdBy', 'name email')
            .populate('lastEditedBy', 'name email')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Document.countDocuments({ isDeleted: false });

        res.json({
            documents,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get recent activity (last 5 edited docs)
router.get('/activity', auth, async (req, res) => {
    try {
        const recentDocs = await Document.find({ isDeleted: false })
            .populate('lastEditedBy', 'name email')
            .populate('createdBy', 'name email')
            .sort({ updatedAt: -1 })
            .limit(5)
            .select('title updatedAt lastEditedBy createdBy');

        res.json({ recentActivity: recentDocs });
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single document
router.get('/:id', auth, async (req, res) => {
    try {
        const document = await Document.findOne({ _id: req.params.id, isDeleted: false })
            .populate('createdBy', 'name email')
            .populate('lastEditedBy', 'name email')
            .populate('versions.createdBy', 'name email');

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        res.json({ document });
    } catch (error) {
        console.error('Get document error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create document
router.post('/', auth, async (req, res) => {
    try {
        const { title, content, autoSummarize = true, autoTags = true } = req.body;

        let summary = '';
        let tags = [];
        let embedding = [];

        // Generate AI features if requested
        if (autoSummarize) {
            try {
                summary = await summarizeDocument(title, content);
            } catch (error) {
                console.error('Auto-summarize failed:', error);
            }
        }

        if (autoTags) {
            try {
                tags = await generateTags(title, content);
            } catch (error) {
                console.error('Auto-tags failed:', error);
            }
        }

        // Generate embedding for semantic search
        try {
            const embeddingText = `${title} ${content} ${summary}`;
            embedding = await generateEmbedding(embeddingText);
        } catch (error) {
            console.error('Embedding generation failed:', error);
        }

        const document = new Document({
            title,
            content,
            summary,
            tags,
            embedding,
            createdBy: req.user._id,
            lastEditedBy: req.user._id
        });

        await document.save();
        await document.populate('createdBy', 'name email');

        res.status(201).json({
            message: 'Document created successfully',
            document
        });
    } catch (error) {
        console.error('Create document error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update document
router.put('/:id', auth, ownerOrAdminAuth(Document), async (req, res) => {
    try {
        const { title, content, tags, summary } = req.body;
        const document = req.document;

        // Update fields
        if (title !== undefined) document.title = title;
        if (content !== undefined) document.content = content;
        if (tags !== undefined) document.tags = tags;
        if (summary !== undefined) document.summary = summary;

        document.lastEditedBy = req.user._id;

        // Regenerate embedding if content changed
        if (title !== undefined || content !== undefined || summary !== undefined) {
            try {
                const embeddingText = `${document.title} ${document.content} ${document.summary}`;
                document.embedding = await generateEmbedding(embeddingText);
            } catch (error) {
                console.error('Embedding update failed:', error);
            }
        }

        await document.save();
        await document.populate([
            { path: 'createdBy', select: 'name email' },
            { path: 'lastEditedBy', select: 'name email' }
        ]);

        res.json({
            message: 'Document updated successfully',
            document
        });
    } catch (error) {
        console.error('Update document error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete document
router.delete('/:id', auth, ownerOrAdminAuth(Document), async (req, res) => {
    try {
        const document = req.document;
        document.isDeleted = true;
        await document.save();

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Generate summary for existing document
router.post('/:id/summarize', auth, ownerOrAdminAuth(Document), async (req, res) => {
    try {
        const document = req.document;
        const summary = await summarizeDocument(document.title, document.content);

        document.summary = summary;
        document.lastEditedBy = req.user._id;

        // Update embedding
        const embeddingText = `${document.title} ${document.content} ${summary}`;
        document.embedding = await generateEmbedding(embeddingText);

        await document.save();

        res.json({
            message: 'Summary generated successfully',
            summary
        });
    } catch (error) {
        console.error('Generate summary error:', error);
        res.status(500).json({ message: 'Failed to generate summary' });
    }
});

// Generate tags for existing document
router.post('/:id/generate-tags', auth, ownerOrAdminAuth(Document), async (req, res) => {
    try {
        const document = req.document;
        const tags = await generateTags(document.title, document.content);

        document.tags = tags;
        document.lastEditedBy = req.user._id;
        await document.save();

        res.json({
            message: 'Tags generated successfully',
            tags
        });
    } catch (error) {
        console.error('Generate tags error:', error);
        res.status(500).json({ message: 'Failed to generate tags' });
    }
});

module.exports = router;