import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, EmptyState, Spinner, Card, Badge } from "@/components/ui";
import CVUploader from "@/components/CVUploader";
import CVVersionCard from "@/components/CVVersionCard";
import useCVManager from "@/hooks/useCVManager";
import { useToast } from "@/context/ToastContext";

const CVManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    masterCV,
    cvVersions,
    isLoading,
    error,
    refetch,
    deleteVersion,
    deleteMasterCV,
  } = useCVManager();

  const [showUploader, setShowUploader] = useState(false);
  const [deletingVersionId, setDeletingVersionId] = useState(null);

  const handleUploadSuccess = (cvRecord) => {
    setShowUploader(false);
    refetch();
    toast.success("CV uploaded! You can now create tailored versions.");
  };

  const handleDeleteVersion = async (versionId) => {
    const confirmed = window.confirm(
      "Delete this CV version? This cannot be undone.",
    );
    if (!confirmed) return;

    setDeletingVersionId(versionId);
    try {
      await deleteVersion(versionId);
      toast.success("CV version deleted.");
    } catch (error) {
      toast.error(error.message || "Failed to delete version.");
    } finally {
      setDeletingVersionId(null);
    }
  };

  const handleDeleteMasterCV = async () => {
    const confirmed = window.confirm(
      "Delete your master CV? This will also delete all tailored versions. This cannot be undone.",
    );
    if (!confirmed) return;

    try {
      await deleteMasterCV();
      toast.success("Master CV deleted.");
      refetch();
    } catch (error) {
      toast.error(error.message || "Failed to delete CV.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-sm text-coral-600">{error}</p>
        <Button variant="outline" onClick={refetch}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className=" space-y-6">
      {/* Master CV section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Master CV</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Your base CV — all tailored versions are created from this
            </p>
          </div>
          {masterCV && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploader(true)}
            >
              Replace CV
            </Button>
          )}
        </div>

        {/* Upload area */}
        {(!masterCV || showUploader) && (
          <div className="mb-4">
            <CVUploader onUploadSuccess={handleUploadSuccess} />
            {showUploader && masterCV && (
              <button
                onClick={() => setShowUploader(false)}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                Cancel — keep current CV
              </button>
            )}
          </div>
        )}

        {/* Current master CV card */}
        {masterCV && !showUploader && (
          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#534AB7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {masterCV.file_name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="success" size="sm">
                    Active
                  </Badge>
                  <span className="text-xs text-gray-400 uppercase">
                    {masterCV.file_type}
                  </span>
                  <span className="text-xs text-gray-400">
                    Uploaded{" "}
                    {new Date(masterCV.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <button
                onClick={handleDeleteMasterCV}
                className="text-xs text-gray-400 hover:text-coral-600 cursor-pointer transition-colors flex-shrink-0"
              >
                Delete
              </button>
            </div>

            {/* Quick actions */}
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-50">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/decoder")}
              >
                Decode a job
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                View job targets
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Tailored versions section */}
      <div>
        <div className="flex items-center w-full justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Tailored versions
              {cvVersions.length > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-400">
                  {cvVersions.length} total
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Each version is tailored for a specific role
            </p>
          </div>
        </div>

        {cvVersions.length === 0 ? (
          <EmptyState
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#534AB7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            }
            title="No tailored versions yet"
            description={
              masterCV
                ? "Add a job target on the dashboard, decode it, then tailor your CV for it."
                : "Upload your master CV first, then add job targets to start tailoring."
            }
            action={() =>
              masterCV ? navigate("/dashboard") : setShowUploader(true)
            }
            actionLabel={masterCV ? "Go to dashboard" : "Upload CV"}
          />
        ) : (
          <div className="grid gap-3">
            {cvVersions.map((version) => (
              <CVVersionCard
                key={version.id}
                version={version}
                onDelete={handleDeleteVersion}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CVManager;
