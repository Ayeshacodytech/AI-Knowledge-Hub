import { Card } from "../components/Card";
import { SearchBar } from "../components/SearchBar";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { TagChip } from "../components/TagChip";
import { DocumentCard } from "../components/DocumentCard";
import { Search } from "lucide-react";
import { api } from "../App";
import React, { createContext, useContext, useEffect, useState } from "react";
export const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('text');
  const [selectedTags, setSelectedTags] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  useEffect(() => {
    loadAvailableTags();
  }, []);

  const loadAvailableTags = async () => {
    try {
      const response = await api.getAllTags();
      setAvailableTags(response.tags?.map(tag => tag.name) || []);
    } catch (error) {
      console.error('Failed to load tags:', error);
      // Fallback to common tags if API fails
      setAvailableTags(['machine-learning', 'react', 'javascript', 'ai', 'best-practices', 'collaboration']);
    } finally {
      setTagsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      let response;
      if (searchType === 'semantic') {
        response = await api.searchSemantic(searchQuery);
        setResults(response.documents || []);
      } else {
        response = await api.searchText(searchQuery, selectedTags);
        setResults(response.documents || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
      alert('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const removeTag = (tag) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Search Knowledge Base</h1>
        <p className="text-gray-600 mt-2">Find documents using text search or AI-powered semantic search</p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            searchType={searchType}
            onSearchTypeChange={setSearchType}
          />

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Filter by Tags</h3>

            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Selected:</span>
                {selectedTags.map(tag => (
                  <TagChip
                    key={tag}
                    tag={tag}
                    variant="selected"
                    onRemove={removeTag}
                  />
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {tagsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <LoadingSpinner size="sm" />
                  Loading tags...
                </div>
              ) : (
                availableTags.map(tag => (
                  <TagChip
                    key={tag}
                    tag={tag}
                    variant={selectedTags.includes(tag) ? 'selected' : 'default'}
                    onClick={() => toggleTag(tag)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {results.length > 0 && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Search Results ({results.length})
            </h2>
            {searchType === 'semantic' && (
              <div className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
                AI Semantic Search
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map(document => (
              <DocumentCard
                key={document._id}
                document={document}
                onEdit={() => { }}
                onDelete={() => { }}
                onSummarize={() => { }}
                onGenerateTags={() => { }}
              />
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && searchQuery && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">Try different keywords or search terms</p>
        </div>
      )}
    </div>
  );
};