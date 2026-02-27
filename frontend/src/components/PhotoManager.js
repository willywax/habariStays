import React, { useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "../App";
import { Star, ArrowUp, ArrowDown, Trash2, Plus, Image, Loader2, X } from "lucide-react";

const CLOUDINARY_TRANSFORMS = {
  thumb: "c_fill,f_auto,g_auto,h_213,q_auto:good,w_320",
  mobile: "c_limit,f_auto,h_427,q_auto:good,w_640",
  web: "c_limit,f_auto,h_854,q_auto:best,w_1280",
  hd: "c_limit,f_auto,h_1280,q_auto:best,w_1920",
};

// Helper to extract the right URL from a photo object (handles both old string and new object format)
export function getPhotoUrl(photo, size = "mobile") {
  if (!photo) return "";
  if (typeof photo === "string") return photo;
  const key = `cloudinary_${size}`;
  return photo[key] || photo.cloudinary_original || photo.cloudinary_web || photo.cloudinary_mobile || photo.cloudinary_thumb || "";
}

// Get cover photo URL from photos array
export function getCoverUrl(photos, size = "web") {
  if (!photos || !photos.length) return null;
  const primary = photos.find((p) => typeof p === "object" && p.is_primary);
  if (primary) return getPhotoUrl(primary, size);
  return getPhotoUrl(photos[0], size);
}

// Generate responsive URLs from a Cloudinary public_id
function generateResponsiveUrls(secureUrl, publicId, cloudName) {
  const base = `https://res.cloudinary.com/${cloudName}/image/upload`;
  return {
    cloudinary_original: secureUrl,
    cloudinary_thumb: `${base}/${CLOUDINARY_TRANSFORMS.thumb}/v1/${publicId}`,
    cloudinary_mobile: `${base}/${CLOUDINARY_TRANSFORMS.mobile}/v1/${publicId}`,
    cloudinary_web: `${base}/${CLOUDINARY_TRANSFORMS.web}/v1/${publicId}`,
    cloudinary_hd: `${base}/${CLOUDINARY_TRANSFORMS.hd}/v1/${publicId}`,
  };
}

const PhotoManager = ({
  photos = [],
  entityType = "hotel", // "hotel" or "room"
  entityId,
  maxPhotos = 10,
  onPhotosChange,
  canUpload = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  // Normalize photos to always be objects
  const normalizedPhotos = photos
    .map((p, i) => {
      if (typeof p === "string") {
        return { id: `legacy-${i}`, is_primary: i === 0, sort_order: i, cloudinary_original: p, cloudinary_thumb: p, cloudinary_mobile: p, cloudinary_web: p, cloudinary_hd: p, source: "legacy" };
      }
      return p;
    })
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const apiBase = entityType === "hotel" ? `/hotels/${entityId}/photos` : `/rooms/${entityId}/photos`;

  const handleSetPrimary = async (photoId) => {
    try {
      await api.patch(`${apiBase}/${photoId}/set-primary`);
      toast.success("Picha ya kwanza imebadilishwa");
      onPhotosChange?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Imeshindikana");
    }
  };

  const handleReorder = async (photoId, direction) => {
    const idx = normalizedPhotos.findIndex((p) => p.id === photoId);
    if ((direction === "up" && idx <= 0) || (direction === "down" && idx >= normalizedPhotos.length - 1)) return;

    const newOrder = [...normalizedPhotos];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];

    try {
      await api.patch(`${apiBase}/reorder`, { photo_ids: newOrder.map((p) => p.id) });
      toast.success("Mpangilio umebadilishwa");
      onPhotosChange?.();
    } catch (err) {
      toast.error("Imeshindikana");
    }
  };

  const handleDelete = async (photoId) => {
    const photo = normalizedPhotos.find((p) => p.id === photoId);
    if (normalizedPhotos.length <= 1) {
      toast.error("Lazima kuwe na picha moja angalau");
      return;
    }
    setDeleteConfirm({ id: photoId, isPrimary: photo?.is_primary });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`${apiBase}/${deleteConfirm.id}`);
      toast.success("Picha imefutwa");
      setDeleteConfirm(null);
      onPhotosChange?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Imeshindikana");
    }
  };

  const handleUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("JPG, PNG au WEBP tu");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Picha kubwa mno (max 10MB)");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Get Cloudinary config
      const configRes = await api.get("/config/cloudinary");
      const { cloud_name, upload_preset, folder } = configRes.data;

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", upload_preset);
      formData.append("folder", folder);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      });

      const cloudinaryResult = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
          else reject(new Error("Upload failed"));
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`);
        xhr.send(formData);
      });

      const urls = generateResponsiveUrls(cloudinaryResult.secure_url, cloudinaryResult.public_id, cloud_name);

      // Save to backend
      await api.post(apiBase, {
        ...urls,
        source: "uploaded",
      });

      toast.success("Picha imepakiwa!");
      onPhotosChange?.();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Imeshindikana kupakia picha");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = "";
    }
  }, [apiBase, onPhotosChange]);

  return (
    <div className="space-y-4" data-testid="photo-manager">
      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {normalizedPhotos.map((photo, idx) => (
          <div
            key={photo.id}
            className="relative group rounded-xl overflow-hidden border-2 border-transparent hover:border-[#9A3324]/30 transition-all bg-white shadow-sm"
            data-testid={`photo-card-${photo.id}`}
          >
            <div className="aspect-[3/2] relative cursor-pointer" onClick={() => setLightbox(photo)}>
              <img
                src={getPhotoUrl(photo, "mobile")}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Sort order badge */}
              <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                #{idx + 1}
              </span>
              {/* Primary badge */}
              {photo.is_primary && (
                <span className="absolute top-2 right-2 bg-[#F4A723] text-white text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1" data-testid={`primary-badge-${photo.id}`}>
                  <Star className="w-3 h-3 fill-current" /> PRIMARY
                </span>
              )}
            </div>
            {/* Actions on hover */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1.5 justify-center">
                {!photo.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(photo.id)}
                    className="flex items-center gap-1 bg-[#F4A723] text-white text-xs px-2 py-1.5 rounded-lg hover:bg-[#D99A1F] font-medium"
                    data-testid={`set-primary-${photo.id}`}
                    title="Set as Primary"
                  >
                    <Star className="w-3 h-3" /> Primary
                  </button>
                )}
                <button
                  onClick={() => handleReorder(photo.id, "up")}
                  disabled={idx === 0}
                  className="bg-white/20 backdrop-blur text-white p-1.5 rounded-lg hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleReorder(photo.id, "down")}
                  disabled={idx === normalizedPhotos.length - 1}
                  className="bg-white/20 backdrop-blur text-white p-1.5 rounded-lg hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="bg-red-500/80 text-white p-1.5 rounded-lg hover:bg-red-600"
                  data-testid={`delete-photo-${photo.id}`}
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Upload button */}
        {canUpload && normalizedPhotos.length < maxPhotos && (
          <label className="aspect-[3/2] rounded-xl border-2 border-dashed border-[#A1A1AA] flex flex-col items-center justify-center cursor-pointer hover:border-[#9A3324] hover:bg-[#9A3324]/5 transition-all" data-testid="upload-photo-btn">
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />
            {uploading ? (
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-[#9A3324] animate-spin mx-auto mb-2" />
                <p className="text-sm font-medium text-[#9A3324]">{uploadProgress}%</p>
                <div className="w-24 bg-[#E4E4E7] rounded-full h-1.5 mt-1">
                  <div className="bg-[#9A3324] h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : (
              <>
                <Plus className="w-8 h-8 text-[#A1A1AA] mb-2" />
                <p className="text-sm text-[#A1A1AA] font-medium">Ongeza Picha</p>
                <p className="text-xs text-[#D4D4D8] mt-1">JPG, PNG, WEBP (max 10MB)</p>
              </>
            )}
          </label>
        )}
      </div>

      {normalizedPhotos.length === 0 && (
        <div className="text-center py-8 text-[#A1A1AA]">
          <Image className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Hakuna picha</p>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="delete-photo-modal">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B] mb-2">Futa Picha?</h3>
            <p className="text-sm text-[#52525B] mb-1">Una uhakika unataka kufuta picha hii?</p>
            {deleteConfirm.isPrimary && (
              <p className="text-sm text-[#E07B2A] bg-[#E07B2A]/10 px-3 py-2 rounded-lg my-3">
                Picha hii ni ya kwanza. Picha inayofuata itakuwa ya kwanza badala yake.
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-border rounded-lg font-medium hover:bg-[#F4F4F5]">Ghairi</button>
              <button onClick={confirmDelete} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600" data-testid="confirm-delete-photo">Futa</button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setLightbox(null)} data-testid="photo-lightbox">
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 bg-white/10 text-white p-2 rounded-full hover:bg-white/20">
            <X className="w-6 h-6" />
          </button>
          <img
            src={getPhotoUrl(lightbox, "hd")}
            alt="Full size"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default PhotoManager;
