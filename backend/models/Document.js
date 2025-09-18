const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
    title: String,
    content: String,
    summary: String,
    tags: [String],
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

const documentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    summary: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    embedding: {
        type: [Number],
        default: []
    },
    versions: [versionSchema],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for semantic search
documentSchema.index({ embedding: 1 });

// Index for text search
documentSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Pre-save middleware to create version history
documentSchema.pre('save', function (next) {
    if (this.isModified(['title', 'content', 'summary', 'tags']) && !this.isNew) {
        // Create a new version with current data
        const version = {
            title: this.title,
            content: this.content,
            summary: this.summary,
            tags: [...this.tags],
            createdBy: this.lastEditedBy || this.createdBy,
            createdAt: new Date()
        };

        this.versions.push(version);

        // Keep only last 10 versions
        if (this.versions.length > 10) {
            this.versions = this.versions.slice(-10);
        }
    }
    next();
});

module.exports = mongoose.model('Document', documentSchema);