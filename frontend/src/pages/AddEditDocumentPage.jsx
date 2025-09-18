import { CheckCircle,Sparkles,Tag } from "lucide-react";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { api } from "../App";
import React, { createContext, useContext, useEffect, useState } from "react";
export const AddEditDocumentPage = ({ edit = false, setCurrentPage }) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    autoSummarize: true,
    autoTags: true,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (edit) {
        await api.updateDocument("1", formData);
      } else {
        await api.createDocument(formData);
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setCurrentPage("dashboard");
      }, 2000);
    } catch (error) {
      console.error("Failed to save document:", error);
      alert("Failed to save document. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {edit ? "Edit Document" : "Create New Document"}
          </h1>
          <p className="text-gray-600 mt-2">
            {edit
              ? "Update your document with AI assistance"
              : "Add a new document to your knowledge base"}
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl">
            <CheckCircle size={16} />
            <span>Document saved!</span>
          </div>
        )}
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Document Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Enter a descriptive title for your document"
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="Write your document content here..."
              rows={12}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 resize-vertical"
              required
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoSummarize}
                onChange={(e) =>
                  setFormData({ ...formData, autoSummarize: e.target.checked })
                }
                className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Sparkles size={16} className="text-blue-600" />
                Auto-generate summary with AI
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoTags}
                onChange={(e) =>
                  setFormData({ ...formData, autoTags: e.target.checked })
                }
                className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Tag size={16} className="text-blue-600" />
                Auto-generate tags with AI
              </span>
            </label>
          </div>

          <div className="flex gap-4 pt-6">
            <Button type="submit" loading={loading} className="flex-1">
              {edit ? "Update Document" : "Create Document"}
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setCurrentPage("dashboard")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
