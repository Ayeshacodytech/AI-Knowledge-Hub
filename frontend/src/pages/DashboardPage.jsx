import { Button } from "../components/Button";
import { ActivityFeed } from "../components/ActivityFeed";
import { Card } from "../components/Card";
import { Pagination } from "../components/Pagination";
import { DocumentCard } from "../components/DocumentCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { api } from "../App";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Search,
  Brain,
  Plus,
  Zap,
  Activity,
  TrendingUp,
  FileText,
  Users,
  Filter,
  Sparkles,
} from "lucide-react";
//DashBoardPage updated
export const DashBoardPage = ({ setCurrentPage }) => {
  const [documents, setDocuments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [currentPage, setCurrentPageNum] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadDocuments();
    loadActivities();
  }, [currentPage]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.getDocuments(currentPage, 6);
      setDocuments(response.documents || []);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error("Failed to load documents:", error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const response = await api.getActivity();
      setActivities(response.recentActivity || []);
    } catch (error) {
      console.error("Failed to load activities:", error);
      setActivities([]);
    }
  };

  const handleEdit = (document) => {
    console.log("Edit document:", document);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await api.deleteDocument(id);
        loadDocuments();
        loadActivities();
      } catch (error) {
        console.error("Failed to delete document:", error);
        alert("Failed to delete document. Please try again.");
      }
    }
  };

  const handleSummarize = async (id) => {
    try {
      const response = await api.summarizeDocument(id);
      setDocuments((docs) =>
        docs.map((doc) =>
          doc._id === id ? { ...doc, summary: response.summary } : doc
        )
      );
    } catch (error) {
      console.error("Failed to generate summary:", error);
      alert("Failed to generate summary. Please try again.");
    }
  };

  const handleGenerateTags = async (id) => {
    try {
      const response = await api.generateTags(id);
      setDocuments((docs) =>
        docs.map((doc) =>
          doc._id === id ? { ...doc, tags: response.tags } : doc
        )
      );
    } catch (error) {
      console.error("Failed to generate tags:", error);
      alert("Failed to generate tags. Please try again.");
    }
  };

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Knowledge Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your team's knowledge base with AI-powered tools
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary">
            <TrendingUp size={16} />
            Analytics
          </Button>
          <Button onClick={() => setCurrentPage("add-document")}>
            <Plus size={16} />
            Add Document
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {documents.length}
              </p>
              <p className="text-gray-600 text-sm">Documents</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Users className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">12</p>
              <p className="text-gray-600 text-sm">Team Members</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Sparkles className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">89%</p>
              <p className="text-gray-600 text-sm">AI Enhanced</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Activity className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">24</p>
              <p className="text-gray-600 text-sm">Recent Edits</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
              />
            </div>
            <Button variant="secondary">
              <Filter size={16} />
              Filters
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDocuments.map((document) => (
                  <DocumentCard
                    key={document._id}
                    document={document}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onSummarize={handleSummarize}
                    onGenerateTags={handleGenerateTags}
                  />
                ))}
              </div>

              {pagination.total > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={pagination.current}
                    totalPages={pagination.total}
                    onPageChange={setCurrentPageNum}
                    hasNext={pagination.hasNext}
                    hasPrev={pagination.hasPrev}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-6">
          <ActivityFeed activities={activities} />

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap size={20} className="text-yellow-600" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setCurrentPage("add-document")}
              >
                <Plus size={16} />
                Create Document
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setCurrentPage("qa")}
              >
                <Brain size={16} />
                Ask AI Question
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setCurrentPage("search")}
              >
                <Search size={16} />
                Advanced Search
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
