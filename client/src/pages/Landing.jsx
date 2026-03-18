import { Link } from "react-router-dom";
import { Button, Badge, Card, MatchScoreRing } from "@/components/ui";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold text-brand-600">
          Seevv Design System
        </h1>

        {/* Buttons */}
        <Card>
          <p className="text-xs text-gray-400 mb-3">Buttons</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button isLoading>Loading</Button>
          </div>
        </Card>

        {/* Badges */}
        <Card>
          <p className="text-xs text-gray-400 mb-3">Badges</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="brand">Brand</Badge>
            <Badge variant="success">Match</Badge>
            <Badge variant="warning">Partial</Badge>
            <Badge variant="danger">Gap</Badge>
            <Badge variant="default">Default</Badge>
          </div>
        </Card>

        {/* Match Score Rings */}
        <Card>
          <p className="text-xs text-gray-400 mb-3">Match score rings</p>
          <div className="flex gap-6 items-center">
            <div className="text-center">
              <MatchScoreRing score={88} size="lg" />
              <p className="text-xs text-gray-400 mt-2">High</p>
            </div>
            <div className="text-center">
              <MatchScoreRing score={65} size="lg" />
              <p className="text-xs text-gray-400 mt-2">Medium</p>
            </div>
            <div className="text-center">
              <MatchScoreRing score={42} size="lg" />
              <p className="text-xs text-gray-400 mt-2">Low</p>
            </div>
          </div>
        </Card>

        <Link to="/signup">
          <Button variant="primary" size="lg" fullWidth>
            Continue to app →
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Landing;
