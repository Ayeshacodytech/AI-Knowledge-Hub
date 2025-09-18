import { AlertCircle } from "lucide-react";
export const Input = ({ label, error, className = "", ...props }) => (
  <div className="space-y-2">
    {label && (
      <label className="block text-sm font-medium text-gray-700">{label}</label>
    )}
    <input
      className={`w-full px-4 py-3 border-2 rounded-xl transition-colors duration-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 ${
        error ? "border-red-300 focus:border-red-500" : "border-gray-200"
      } ${className}`}
      {...props}
    />
    {error && (
      <p className="text-sm text-red-600 flex items-center gap-1">
        <AlertCircle size={16} />
        {error}
      </p>
    )}
  </div>
);
