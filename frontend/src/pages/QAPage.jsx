import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Brain,MessageSquare,ArrowRight } from "lucide-react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../App";
export const QAPage = () => {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage = {
      type: "user",
      content: question,
      timestamp: new Date(),
    };
    setConversation((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await api.askQuestion(question);
      const aiMessage = {
        type: "ai",
        content: response.answer,
        sources: response.relevantDocuments || [],
        timestamp: new Date(),
      };
      setConversation((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage = {
        type: "ai",
        content:
          "Sorry, I encountered an error while processing your question. Please try again.",
        sources: [],
        timestamp: new Date(),
      };
      setConversation((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "What are the best practices for React development?",
    "How does machine learning work?",
    "What are effective team collaboration strategies?",
    "How to optimize database performance?",
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Q&A Assistant</h1>
        <p className="text-gray-600 mt-2">
          Ask questions about your knowledge base and get AI-powered answers
        </p>
      </div>

      <Card className="h-96 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {conversation.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to help!
              </h3>
              <p className="text-gray-600">
                Ask me anything about your knowledge base
              </p>
            </div>
          ) : (
            conversation.map((message, index) => (
              <div
                key={index}
                className={`flex gap-4 ${
                  message.type === "user" ? "justify-end" : ""
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.type === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p>{message.content}</p>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                      <p className="text-gray-600 mb-2">Sources:</p>
                      {message.sources.slice(0, 2).map((source, i) => (
                        <div key={i} className="text-xs text-gray-500">
                          • {source.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-4">
              <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your knowledge base..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
              disabled={loading}
            />
            <Button type="submit" disabled={!question.trim() || loading}>
              <MessageSquare size={16} />
              Ask
            </Button>
          </form>
        </div>
      </Card>

      {conversation.length === 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Suggested Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestedQuestions.map((q, index) => (
              <button
                key={index}
                onClick={() => setQuestion(q)}
                className="text-left p-4 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ArrowRight size={16} className="text-gray-400" />
                  <span>{q}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
