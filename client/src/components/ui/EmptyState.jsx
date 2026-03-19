import { Button } from "@/components/ui";

const EmptyState = ({ icon, title, description, action, actionLabel }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {icon && (
        <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-400 max-w-sm leading-relaxed mb-6">
        {description}
      </p>
      {action && (
        <Button variant="primary" onClick={action}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
