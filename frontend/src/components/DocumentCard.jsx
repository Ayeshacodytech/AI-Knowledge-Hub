import { Card } from "./Card";
import { TagChip } from "./TagChip";
import { Button } from "./Button";
import { Tag,Sparkles,Edit3,Trash2,User,Clock } from "lucide-react";
import React, { createContext, useContext, useEffect, useState } from "react";
export const DocumentCard = ({
  document,
  onEdit,
  onDelete,
  onSummarize,
  onGenerateTags,
}) => {
  const [loading, setLoading] = useState({ summarize: false, tags: false });

  const handleSummarize = async () => {
    setLoading((prev) => ({ ...prev, summarize: true }));
    try {
      await onSummarize(document._id);
    } finally {
      setLoading((prev) => ({ ...prev, summarize: false }));
    }
  };

  const handleGenerateTags = async () => {
    setLoading((prev) => ({ ...prev, tags: true }));
    try {
      await onGenerateTags(document._id);
    } finally {
      setLoading((prev) => ({ ...prev, tags: false }));
    }
  };

  return (
    <Card hover className="p-6 group">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {document.title}
          </h3>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(document)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={() => onDelete(document._id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {document.summary && (
          <p className="text-gray-600 text-sm line-clamp-3">
            {document.summary}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {document.tags?.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <User size={14} />
            <span>{document.createdBy?.name}</span>
            <Clock size={14} className="ml-2" />
            <span>{new Date(document.updatedAt).toLocaleDateString()}</span>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSummarize}
              loading={loading.summarize}
            >
              <Sparkles size={14} />
              Summarize
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleGenerateTags}
              loading={loading.tags}
            >
              <Tag size={14} />
              Tags
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
