import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const useLatestPatientComment = (patientId) => {
  const { token } = useSelector((state) => state.auth);
  const [latestComment, setLatestComment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId || !token) return;

    const abortController = new AbortController();

    const fetchLatestComment = async () => {
      setIsLoading(true);
      setError("");
      setLatestComment(null);
      try {
        const response = await fetch(
          `/api/patients/comments?patientId=${patientId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: abortController.signal,
          },
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch comments.");
        }
        const comments = Array.isArray(data?.comments) ? data.comments : [];
        setLatestComment(comments.at(-1) ?? null);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message || "Unable to load the latest comment.");
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false);
      }
    };

    fetchLatestComment();

    return () => abortController.abort();
  }, [patientId, token]);

  return { latestComment, isLoading, error };
};

export default useLatestPatientComment;
