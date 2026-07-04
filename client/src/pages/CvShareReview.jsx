import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/api";

const CvShareReview = () => {
  const { token } = useParams();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [name, setName]         = useState("");
  const [comment, setComment]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  useEffect(() => {
    api.get(`/cv-review/public/${token}`)
      .then((d) => setData(d))
      .catch((err) => setError(err.message || "Share not found or expired"))
      .finally(() => setLoading(false));
  }, [token]);

  const submitComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const newComment = await api.post(`/cv-review/public/${token}/comment`, {
        reviewerName: name.trim() || "Anonymous",
        content: comment.trim(),
      });
      setData((d) => ({ ...d, comments: [...(d.comments || []), newComment] }));
      setComment("");
      setName("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      alert(err.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 rounded-full border-4 border-brand-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1 className="text-lg font-bold text-gray-900">Link unavailable</h1>
        <p className="text-sm text-gray-400 text-center max-w-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-sm font-bold text-gray-900">{data.title || "CV Review"}</h1>
            <p className="text-xs text-gray-400 mt-0.5">Shared by {data.ownerName} · {data.viewCount} view{data.viewCount !== 1 ? "s" : ""}</p>
          </div>
          <a
            href="https://seevv.io"
            className="text-xs font-bold text-brand-700 hover:text-brand-900 transition-colors"
          >
            Seevv
          </a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-8 space-y-8">
        {/* CV text */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">{data.fileName || "CV"}</h2>
          </div>
          <pre className="px-6 py-5 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans overflow-x-auto">
            {data.rawText || "No CV text available."}
          </pre>
        </div>

        {/* Comments */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Feedback ({data.comments?.length || 0})
          </h2>

          {(data.comments || []).length === 0 ? (
            <p className="text-sm text-gray-400">No feedback yet. Be the first to leave a comment.</p>
          ) : (
            <div className="space-y-3">
              {data.comments.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold text-gray-900">{c.reviewer_name}</p>
                    <p className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-semibold text-gray-900">Leave feedback</h3>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent placeholder:text-gray-400"
            />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts on this CV…"
              rows={4}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none placeholder:text-gray-400"
            />
            {submitted && (
              <p className="text-xs text-teal-600 font-medium">Feedback posted — thank you!</p>
            )}
            <button
              onClick={submitComment}
              disabled={submitting || !comment.trim()}
              className="px-5 py-2.5 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-800 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {submitting ? "Posting…" : "Post feedback"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          Powered by <a href="https://seevv.io" className="font-semibold text-brand-600 hover:underline">Seevv</a>
        </p>
      </div>
    </div>
  );
};

export default CvShareReview;
