import { Button } from './components/Button';
import { Card } from './components/Card';
import { ConnectionStatus } from './components/ConnectionStatus';
import { Navigation } from './components/Navigation';
import { LoadingSpinner } from './components/LoadingSpinner';
import { QAPage } from './pages/QAPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SearchPage } from './pages/SearchPage';
import { DashboardPage } from './pages/DashBoardPage';
import { AddEditDocumentPage } from './pages/AddEditDocumentPage';
import {AlertCircle} from 'lucide-react';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Auth Context
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// API Service with Backend Integration
 export const api = {
  baseURL: 'http://localhost:5000/api',

  // Helper function to get auth token
  getAuthToken: () => {
    return localStorage.getItem('token');
  },

  // Helper function to make authenticated requests
  makeRequest: async (url, options = {}) => {
    const token = api.getAuthToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    const response = await fetch(`${api.baseURL}${url}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Authentication endpoints
  login: async (credentials) => {
    return await api.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  register: async (userData) => {
    return await api.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  getCurrentUser: async () => {
    return await api.makeRequest('/auth/me');
  },

  // Document endpoints
  getDocuments: async (page = 1, limit = 6) => {
    return await api.makeRequest(`/documents?page=${page}&limit=${limit}`);
  },

  getDocument: async (id) => {
    return await api.makeRequest(`/documents/${id}`);
  },

  createDocument: async (docData) => {
    return await api.makeRequest('/documents', {
      method: 'POST',
      body: JSON.stringify(docData)
    });
  },

  updateDocument: async (id, docData) => {
    return await api.makeRequest(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(docData)
    });
  },

  deleteDocument: async (id) => {
    return await api.makeRequest(`/documents/${id}`, {
      method: 'DELETE'
    });
  },

  summarizeDocument: async (id) => {
    return await api.makeRequest(`/documents/${id}/summarize`, {
      method: 'POST'
    });
  },

  generateTags: async (id) => {
    return await api.makeRequest(`/documents/${id}/generate-tags`, {
      method: 'POST'
    });
  },

  getActivity: async () => {
    return await api.makeRequest('/documents/activity');
  },

  // Search endpoints
  searchText: async (query, tags = [], page = 1, limit = 10) => {
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (tags.length > 0) {
      params.append('tags', tags.join(','));
    }

    return await api.makeRequest(`/search/text?${params}`);
  },

  searchSemantic: async (query, limit = 10, threshold = 0.3) => {
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
      threshold: threshold.toString()
    });

    return await api.makeRequest(`/search/semantic?${params}`);
  },

  searchHighlight: async (query, page = 1, limit = 10) => {
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      limit: limit.toString()
    });

    return await api.makeRequest(`/search/highlight?${params}`);
  },

  advancedSearch: async (searchParams) => {
    return await api.makeRequest('/search/advanced', {
      method: 'POST',
      body: JSON.stringify(searchParams)
    });
  },

  getSimilarDocuments: async (id, limit = 5) => {
    return await api.makeRequest(`/search/similar/${id}?limit=${limit}`);
  },

  getAllTags: async () => {
    return await api.makeRequest('/search/tags');
  },

  getSearchSuggestions: async (query, limit = 10) => {
    const params = new URLSearchParams({
      query,
      limit: limit.toString()
    });

    return await api.makeRequest(`/search/suggestions?${params}`);
  },

  getSearchAnalytics: async () => {
    return await api.makeRequest('/search/analytics');
  },

  // AI endpoints
  askQuestion: async (question, includeDeleted = false) => {
    return await api.makeRequest('/ai/qa', {
      method: 'POST',
      body: JSON.stringify({ question, includeDeleted })
    });
  },

  batchSummarize: async (documentIds) => {
    return await api.makeRequest('/ai/batch-summarize', {
      method: 'POST',
      body: JSON.stringify({ documentIds })
    });
  },

  batchGenerateTags: async (documentIds) => {
    return await api.makeRequest('/ai/batch-tags', {
      method: 'POST',
      body: JSON.stringify({ documentIds })
    });
  },

  getAIStats: async () => {
    return await api.makeRequest('/ai/stats');
  },

  // Health check
  healthCheck: async () => {
    const response = await fetch('http://localhost:5000/');
    return response.json();
  }
};

// Connection status hook


// Connection Status Component


// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-6">
          <Card className="p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-red-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">An unexpected error occurred. Please refresh the page to try again.</p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Components


















// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  const authContextValue = {
    user,
    setUser,
    login: async (credentials) => {
      setLoading(true);
      try {
        const response = await api.login(credentials);
        setUser(response.user);
        localStorage.setItem('token', response.token);
        setCurrentPage('dashboard');
        return response;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    register: async (userData) => {
      setLoading(true);
      try {
        const response = await api.register(userData);
        setUser(response.user);
        localStorage.setItem('token', response.token);
        setCurrentPage('dashboard');
        return response;
      } catch (error) {
        console.error('Register error:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    logout: () => {
      setUser(null);
      localStorage.removeItem('token');
      setCurrentPage('login');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      api.getCurrentUser()
        .then(response => {
          setUser(response.user);
          setCurrentPage('dashboard');
        })
        .catch(error => {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          setCurrentPage('login');
        });
    } else {
      setCurrentPage('login');
    }
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage setCurrentPage={setCurrentPage} />;
      case 'register':
        return <RegisterPage setCurrentPage={setCurrentPage} />;
      case 'dashboard':
        return <DashboardPage setCurrentPage={setCurrentPage} />;
      case 'search':
        return <SearchPage />;
      case 'add-document':
        return <AddEditDocumentPage setCurrentPage={setCurrentPage} />;
      case 'edit-document':
        return <AddEditDocumentPage edit setCurrentPage={setCurrentPage} />;
      case 'qa':
        return <QAPage />;
      default:
        return <DashboardPage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <ErrorBoundary>
      <AuthContext.Provider value={authContextValue}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <ConnectionStatus />
          {user && <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />}
          <main className={user ? 'ml-64' : ''}>
            {renderPage()}
          </main>
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <LoadingSpinner size="lg" />
              </div>
            </div>
          )}
        </div>
      </AuthContext.Provider>
    </ErrorBoundary>
  );
}















export default App;