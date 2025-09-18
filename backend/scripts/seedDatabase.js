const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');
const Document = require('../models/Document');

dotenv.config();

const sampleUsers = [
    {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
    },
    {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'user123',
        role: 'user'
    },
    {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'user123',
        role: 'user'
    }
];

const sampleDocuments = [
    {
        title: 'Getting Started with React',
        content: `React is a JavaScript library for building user interfaces. It was developed by Facebook and is now maintained by Facebook and the community.

Key concepts in React include:
1. Components - Reusable pieces of UI
2. JSX - JavaScript XML syntax extension
3. Props - Data passed to components
4. State - Component data that can change
5. Hooks - Functions that let you use state and lifecycle features

React follows a component-based architecture where you build encapsulated components that manage their own state, then compose them to make complex UIs. Since component logic is written in JavaScript instead of templates, you can easily pass rich data through your app and keep state out of the DOM.

React can also render on the server using Node and power mobile apps using React Native. The virtual DOM in React makes updates efficient by only re-rendering components that have actually changed.`,
        tags: ['react', 'javascript', 'frontend', 'web-development'],
        summary: 'An introduction to React, covering key concepts like components, JSX, props, state, and hooks. Explains the component-based architecture and benefits of the virtual DOM.'
    },
    {
        title: 'Node.js Best Practices',
        content: `Node.js is a runtime environment that allows you to run JavaScript on the server side. Here are some best practices for Node.js development:

1. Use Environment Variables
   - Store configuration in environment variables
   - Use dotenv for development
   - Never commit secrets to version control

2. Error Handling
   - Always handle errors properly
   - Use try-catch blocks for async operations
   - Implement global error handlers

3. Security
   - Validate and sanitize input
   - Use HTTPS in production
   - Keep dependencies updated
   - Use security middleware like helmet

4. Performance
   - Use clustering for CPU-intensive tasks
   - Implement caching strategies
   - Monitor memory usage
   - Use compression middleware

5. Code Organization
   - Follow MVC pattern
   - Separate concerns
   - Use proper folder structure
   - Write modular code

6. Testing
   - Write unit tests
   - Use integration tests
   - Mock external dependencies
   - Achieve good test coverage`,
        tags: ['nodejs', 'backend', 'best-practices', 'security'],
        summary: 'A comprehensive guide to Node.js best practices covering environment variables, error handling, security, performance optimization, code organization, and testing strategies.'
    },
    {
        title: 'MongoDB Database Design',
        content: `MongoDB is a NoSQL document database that stores data in flexible, JSON-like documents. Here's a guide to effective MongoDB database design:

Document Structure:
- Embed related data that is accessed together
- Reference data that is accessed independently
- Consider read/write patterns when deciding structure

Schema Design Patterns:
1. Embedding Pattern - Store related data in the same document
2. Referencing Pattern - Store references to documents in other collections
3. Hybrid Pattern - Combine embedding and referencing as needed

Indexing Strategies:
- Create indexes on frequently queried fields
- Use compound indexes for multi-field queries
- Monitor index usage and performance
- Remove unused indexes

Data Modeling Best Practices:
- Design for your application's query patterns
- Avoid large documents (> 16MB limit)
- Use appropriate data types
- Consider data growth over time
- Plan for horizontal scaling

Query Optimization:
- Use explain() to analyze query performance
- Limit document size and field selection
- Use aggregation pipeline efficiently
- Implement proper pagination`,
        tags: ['mongodb', 'database', 'nosql', 'data-modeling'],
        summary: 'A guide to MongoDB database design covering document structure, schema patterns, indexing strategies, and query optimization techniques for NoSQL applications.'
    },
    {
        title: 'API Security Guidelines',
        content: `API security is crucial for protecting your application and user data. Here are essential security guidelines for API development:

Authentication & Authorization:
1. JWT Tokens
   - Use strong secret keys
   - Implement token expiration
   - Store tokens securely on client
   - Consider refresh tokens for long sessions

2. OAuth 2.0
   - Use for third-party integrations
   - Implement proper scopes
   - Secure redirect URIs

Input Validation:
- Validate all input data
- Use schema validation libraries
- Sanitize data to prevent injection attacks
- Implement rate limiting

HTTPS & Transport Security:
- Always use HTTPS in production
- Implement proper SSL/TLS configuration
- Use HSTS headers
- Consider certificate pinning

Data Protection:
- Hash sensitive data (passwords)
- Use encryption for data at rest
- Implement proper logging (avoid logging sensitive data)
- Regular security audits

Error Handling:
- Don't expose internal errors
- Use generic error messages
- Log detailed errors server-side
- Implement proper status codes

Headers & CORS:
- Set security headers (CSP, X-Frame-Options)
- Configure CORS properly
- Use content-type validation`,
        tags: ['api', 'security', 'authentication', 'best-practices'],
        summary: 'Comprehensive API security guidelines covering authentication, input validation, HTTPS, data protection, error handling, and security headers for robust API development.'
    },
    {
        title: 'Machine Learning with Python',
        content: `Python has become the go-to language for machine learning due to its simplicity and powerful libraries. Here's an overview of ML with Python:

Essential Libraries:
1. NumPy - Numerical computing and arrays
2. Pandas - Data manipulation and analysis
3. Scikit-learn - Machine learning algorithms
4. TensorFlow/PyTorch - Deep learning frameworks
5. Matplotlib/Seaborn - Data visualization

Machine Learning Workflow:
1. Data Collection
   - Gather relevant datasets
   - Consider data quality and bias
   - Ensure sufficient data volume

2. Data Preprocessing
   - Handle missing values
   - Feature scaling and normalization
   - Encoding categorical variables
   - Feature selection and engineering

3. Model Selection
   - Choose appropriate algorithms
   - Consider problem type (classification, regression)
   - Evaluate model complexity vs. interpretability

4. Training and Validation
   - Split data (train/validation/test)
   - Cross-validation techniques
   - Hyperparameter tuning
   - Avoid overfitting

5. Model Evaluation
   - Use appropriate metrics
   - Confusion matrix analysis
   - ROC curves and AUC
   - Feature importance analysis

6. Deployment
   - Model serialization
   - API development
   - Monitoring and maintenance
   - Version control for models`,
        tags: ['python', 'machine-learning', 'data-science', 'ai'],
        summary: 'An overview of machine learning with Python, covering essential libraries, ML workflow from data collection to deployment, and best practices for model development.'
    }
];

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Document.deleteMany({});
        console.log('Cleared existing data');

        // Create users
        const createdUsers = [];
        for (const userData of sampleUsers) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = new User({
                ...userData,
                password: hashedPassword
            });
            const savedUser = await user.save();
            createdUsers.push(savedUser);
            console.log(`Created user: ${userData.name}`);
        }

        // Create documents
        for (let i = 0; i < sampleDocuments.length; i++) {
            const docData = sampleDocuments[i];
            const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];

            const document = new Document({
                ...docData,
                createdBy: randomUser._id,
                lastEditedBy: randomUser._id,
                embedding: [] // In real app, this would be generated by Gemini
            });

            await document.save();
            console.log(`Created document: ${docData.title}`);
        }

        console.log('\n✅ Database seeded successfully!');
        console.log('\nSample login credentials:');
        console.log('Admin: admin@example.com / admin123');
        console.log('User 1: john@example.com / user123');
        console.log('User 2: jane@example.com / user123');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the seed function
if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;