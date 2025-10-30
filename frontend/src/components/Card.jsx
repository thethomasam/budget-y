// Base Card component with Tailwind
const Card = ({ children, className = "", span = 1 }) => {
  const spanClasses = {
    1: "",
    2: "col-span-2",
    3: "col-span-3",
    4: "col-span-4",
    "new-row": "col-start-1 col-span-2"
  };

  return (
    <div
      className={`bg-bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all self-start ${spanClasses[span]} ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ title, action }) => {
  return (
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      {action && action}
    </div>
  );
};

export const CardMore = ({ onClick }) => {
  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all text-text-secondary hover:bg-bg-primary"
      onClick={onClick}
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
      </svg>
    </div>
  );
};

export default Card;
