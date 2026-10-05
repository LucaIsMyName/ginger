import type { CSSProperties, ImgHTMLAttributes } from "react";
import { useGingerMetadataState } from "../../context/GingerSplitContexts";
import { getCurrentTrack, resolvedArtwork } from "../../internal/selectors";
import type { DisplayBaseProps } from "../../types";

export type ArtworkProps = DisplayBaseProps &
  Pick<ImgHTMLAttributes<HTMLImageElement>, "sizes" | "loading" | "onError" | "decoding"> & {
    /** Remove default wrapper/image styles for fully custom layout. */
    unstyled?: boolean;
    imgStyle?: CSSProperties;
  };

export function Artwork({
  className,
  style,
  fallback,
  empty,
  sizes,
  loading,
  onError,
  decoding,
  unstyled = false,
  imgStyle,
}: ArtworkProps) {
  const state = useGingerMetadataState();
  const track = getCurrentTrack(state);
  const src = resolvedArtwork(state);
  if (!src) {
    const node = empty ?? fallback ?? null;
    return node ? (
      <span className={className} style={style}>
        {node}
      </span>
    ) : null;
  }
  const alt = [track?.title, track?.artist].filter(Boolean).join(" — ") || "Artwork";
  return (
    <div
      data-ginger-component="Artwork"
      className={className}
      style={
        unstyled
          ? { ...style }
          : {
              background: "var(--ginger-artwork-bg, transparent)",
              borderRadius: "var(--ginger-artwork-radius, 0)",
              overflow: "hidden",
              ...style,
            }
      }
    >
      <img
        src={src}
        alt={alt}
        sizes={sizes}
        loading={loading}
        decoding={decoding}
        onError={onError}
        style={{
          display: unstyled ? undefined : "block",
          width: unstyled ? undefined : "100%",
          height: unstyled ? undefined : "100%",
          objectFit: unstyled ? undefined : "cover",
          ...imgStyle,
        }}
      />
    </div>
  );
}

Artwork.displayName = "Ginger.Current.Artwork";
