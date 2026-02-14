import { useState, useEffect } from "react";

/**
 * Check if a string is an Instagram URL (legacy data)
 */
const isInstagramUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.includes("instagram.com") || url.startsWith("http://") || url.startsWith("https://");
};

/**
 * Hook to get a pre-signed view URL for an S3 image
 * @param imageKey - The S3 key/fileName stored in the database, or legacy Instagram URL
 * @returns The pre-signed URL for viewing the image, or the original URL if it's an Instagram URL
 */
export const useS3Image = (imageKey: string | null | undefined) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageKey) {
      setImageUrl(null);
      return;
    }

    // If it's an Instagram URL (legacy data), return it as-is
    if (isInstagramUrl(imageKey)) {
      setImageUrl(imageKey);
      setLoading(false);
      setError(null);
      return;
    }

    // Otherwise, fetch pre-signed URL from S3
    const fetchViewUrl = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `http://localhost:3000/api/s3/view-url/${encodeURIComponent(imageKey)}`
        );
        const data = await response.json();

        if (data.success && data.viewUrl) {
          setImageUrl(data.viewUrl);
        } else {
          setError("Failed to load image");
        }
      } catch (err) {
        console.error("Error fetching image URL:", err);
        setError("Failed to load image");
      } finally {
        setLoading(false);
      }
    };

    fetchViewUrl();
  }, [imageKey]);

  return { imageUrl, loading, error };
};

