import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-6xl font-semibold text-brand-200 mb-4">404</h2>
        <p className="text-gray-500 mb-6">This page doesn't exist</p>
        <Link
          to="/"
          className="px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-800 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
