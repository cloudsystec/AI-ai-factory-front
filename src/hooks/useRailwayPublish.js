import { useCallback, useEffect, useState } from "react";
import {
  fetchRailwayPublishStatus,
  isPublishInProgress,
  startRailwayPublish,
} from "../lib/railwayPublish.js";

/**
 * Estado e acções de publicação Railway para projetos concluídos.
 * @param {string|null|undefined} projectSlug
 */
export function useRailwayPublish(projectSlug) {
  const [publishStatus, setPublishStatus] = useState(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishError, setPublishError] = useState(null);

  const loadPublishStatus = useCallback(async () => {
    if (!projectSlug) {
      setPublishStatus(null);
      return null;
    }
    try {
      const data = await fetchRailwayPublishStatus(projectSlug);
      setPublishStatus(data);
      return data;
    } catch (e) {
      setPublishStatus(null);
      throw e;
    }
  }, [projectSlug]);

  useEffect(() => {
    setPublishError(null);
    loadPublishStatus().catch(() => {});
  }, [loadPublishStatus]);

  const isPublishing =
    publishLoading || isPublishInProgress(publishStatus);

  useEffect(() => {
    if (!isPublishing || !projectSlug) return undefined;
    const id = window.setInterval(() => {
      loadPublishStatus().catch(() => {});
    }, 4000);
    return () => window.clearInterval(id);
  }, [isPublishing, loadPublishStatus, projectSlug]);

  const handlePublish = useCallback(async () => {
    if (!projectSlug) return;
    setPublishError(null);
    setPublishLoading(true);
    try {
      await startRailwayPublish(projectSlug);
      await loadPublishStatus();
    } catch (e) {
      setPublishError(e.message);
      throw e;
    } finally {
      setPublishLoading(false);
    }
  }, [projectSlug, loadPublishStatus]);

  return {
    publishStatus,
    publishError,
    publishLoading,
    isPublishing,
    handlePublish,
    loadPublishStatus,
  };
}
