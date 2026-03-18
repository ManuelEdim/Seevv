const Card = ({
  children,
  className = "",
  padding = "md",
  hoverable = false,
  onClick,
}) => {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl border border-gray-100 shadow-card
        ${paddings[padding]}
        ${hoverable ? "hover:border-gray-200 hover:shadow-md transition-all duration-150 cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
