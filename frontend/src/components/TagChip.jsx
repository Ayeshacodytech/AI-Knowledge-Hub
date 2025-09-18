export const TagChip = ({ tag, onRemove, onClick, variant = 'default' }) => {
  const variants = {
    default: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    selected: 'bg-blue-600 text-white hover:bg-blue-700',
    removable: 'bg-gray-100 text-gray-700 hover:bg-gray-200 pr-1'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 cursor-pointer ${variants[variant]}`}
      onClick={onClick}
    >
      {tag}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag);
          }}
          className="ml-1 hover:bg-red-200 hover:text-red-700 rounded-full p-0.5 transition-colors"
        >
          ×
        </button>
      )}
    </span>
  );
};