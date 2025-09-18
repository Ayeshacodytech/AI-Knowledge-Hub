import { Button } from "./Button";
import { Search } from "lucide-react";
export const SearchBar = ({
  value,
  onChange,
  onSearch,
  searchType,
  onSearchTypeChange,
  placeholder = "Search documents...",
}) => (
  <div className="relative">
    <div className="flex">
      <div className="relative flex-1">
        <Search
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && onSearch()}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
        />
      </div>

      <div className="ml-3 flex items-center gap-2">
        <select
          value={searchType}
          onChange={(e) => onSearchTypeChange(e.target.value)}
          className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm bg-white"
        >
          <option value="text">Text Search</option>
          <option value="semantic">AI Semantic</option>
        </select>

        <Button onClick={onSearch}>
          <Search size={16} />
          Search
        </Button>
      </div>
    </div>
  </div>
);
