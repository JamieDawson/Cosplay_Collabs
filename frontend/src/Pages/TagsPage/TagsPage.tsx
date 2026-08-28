import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import InstagramComponent from "../../Components/InstagramComponent/InstagramComponent.component";
import Pagination from "../../Components/Pagination/Pagination.component";
import Masonry from "react-masonry-css";
import { apiUrl } from "../../config/api";
import {
  POSTS_PER_PAGE,
  type PaginationMeta,
} from "../../config/pagination";
import { normalizeTag } from "../../utils/tags";
import { COLD_START_LOADING_HINT } from "../../config/loading";

interface Ad {
  id: number;
  user_id: string;
  title: string;
  description: string;
  instagram_post_url: string;
  keywords: string[];
  country?: string;
  state?: string;
  city?: string;
}

const TagsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryKeyword = searchParams.get("q") || "";
  const pageFromUrl = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10) || 1,
  );

  const [typedTag, setTypedTag] = useState(queryKeyword);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  useEffect(() => {
    setTypedTag(queryKeyword);
  }, [queryKeyword]);

  useEffect(() => {
    const fetchAds = async () => {
      if (!queryKeyword) {
        setAds([]);
        setPagination(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const cleanTag = normalizeTag(decodeURIComponent(queryKeyword));

      try {
        const response = await fetch(
          apiUrl(
            `/api/ads/ads-by-tag/${encodeURIComponent(cleanTag)}?page=${pageFromUrl}&limit=${POSTS_PER_PAGE}`,
          ),
        );
        const json = await response.json();
        setAds(json.data || []);
        if (json.pagination) {
          setPagination(json.pagination);
          const tp = json.pagination.totalPages as number;
          if (pageFromUrl > tp && tp >= 1) {
            const next = new URLSearchParams();
            next.set("q", decodeURIComponent(queryKeyword));
            if (tp > 1) next.set("page", String(tp));
            setSearchParams(next, { replace: true });
          }
        } else {
          setPagination(null);
        }
      } catch (error) {
        console.error("Error fetching ads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [queryKeyword, pageFromUrl, setSearchParams]);

  const handleTagChange = (value: string) => {
    setTypedTag(value);
  };

  const lookupTag = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeTag(typedTag);
    const params = new URLSearchParams();
    params.set("q", normalized);
    setSearchParams(params);
  };

  const handleTagClick = (tag: string) => {
    setTypedTag(tag);
    const normalized = normalizeTag(tag);
    const params = new URLSearchParams();
    params.set("q", normalized);
    setSearchParams(params);
  };

  const handlePageChange = (p: number) => {
    const next = new URLSearchParams(searchParams);
    if (p <= 1) {
      next.delete("page");
    } else {
      next.set("page", String(p));
    }
    if (queryKeyword) {
      next.set("q", decodeURIComponent(queryKeyword));
    }
    setSearchParams(next);
  };

  const showEmptyNoResults = useMemo(
    () => !loading && queryKeyword && ads.length === 0,
    [loading, queryKeyword, ads.length],
  );

  return (
    <div className="page-shell">
      <div className="max-w-7xl mx-auto">
        <div className="surface-card-strong mb-8 p-6 md:p-8">
          <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-gradient-brand">
            Tags
          </h2>
          {queryKeyword && (
            <h3 className="text-xl text-slate-600">
              Selected keyword: {decodeURIComponent(queryKeyword)}
            </h3>
          )}
        </div>

        <form
          onSubmit={lookupTag}
          className="surface-card-strong mb-8 p-6 md:p-8"
        >
          <div className="flex flex-col gap-4 md:flex-row">
            <input
              value={typedTag}
              onChange={(e) => handleTagChange(e.target.value)}
              placeholder="Search by tag"
              className="flex-1 rounded-xl border border-slate-200/80 bg-white/80 p-3 text-sm shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 md:text-base"
            />
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-sky-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-sky-400/25 transition-all hover:from-sky-400 hover:to-pink-400 md:text-base"
            >
              Search tag
            </button>
          </div>
        </form>

        {loading ? (
          <div className="surface-card-strong p-10 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-sky-400 border-t-transparent"></div>
              <p className="text-xl text-gray-600">Loading posts…</p>
              <p className="mt-2 max-w-md text-sm text-gray-500">
                {COLD_START_LOADING_HINT}
              </p>
            </div>
          </div>
        ) : ads.length > 0 ? (
          <>
            <Masonry
              breakpointCols={{ default: 3, 1024: 3, 768: 2, 640: 1 }}
              className="my-masonry-grid"
              columnClassName="my-masonry-grid_column"
            >
              {ads.map((ad) => (
                <InstagramComponent
                  key={ad.id.toString()}
                  ad={ad}
                  onTagClick={handleTagClick}
                />
              ))}
            </Masonry>
            {pagination && (
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
                disabled={loading}
              />
            )}
          </>
        ) : showEmptyNoResults ? (
          <div className="surface-card-strong p-10 text-center">
            <p className="text-xl text-slate-600">No ads found for this tag.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TagsPage;
