const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const adminAuth = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

const ownerOrAdminAuth = (Model) => {
    return async (req, res, next) => {
        try {
            const document = await Model.findById(req.params.id);

            if (!document) {
                return res.status(404).json({ message: 'Document not found' });
            }

            if (document.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied' });
            }

            req.document = document;
            next();
        } catch (error) {
            console.error('Owner/Admin auth error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    };
};

module.exports = { auth, adminAuth, ownerOrAdminAuth };