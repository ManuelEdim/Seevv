import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-semibold text-brand-600 mb-2">Seevv</h1>
        <p className="text-gray-500 mb-6">AI-powered career intelligence</p>
        <Link
          to="/signup"
          className="px-6 py-3 bg-blue-700 text-white rounded-lg font-medium hover:bg-indigo-800 transition-colors"
        >
          Get started
        </Link>
      </div>
    </div>
  );
};

export default Landing;
