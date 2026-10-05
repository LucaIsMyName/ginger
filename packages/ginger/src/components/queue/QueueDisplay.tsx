import type { CSSProperties } from "react";
import { useGingerMetadataState } from "../../context/GingerSplitContexts";
import type { DisplayBaseProps } from "../../types";
import { createTextDisplay } from "../current/createTextDisplay";

export const Title = createTextDisplay("Ginger.Queue.Title", (s) => s.playlistMeta?.title);
export const Subtitle = createTextDisplay("Ginger.Queue.Subtitle", (s) => s.playlistMeta?.subtitle);
export const Description = createTextDisplay(
  "Ginger.Queue.Description",
  (s) => s.playlistMeta?.description,
);
export const Copyright = createTextDisplay(
  "Ginger.Queue.Copyright",
  (s) => s.playlistMeta?.copyright,
);

export type QueueArtworkProps = DisplayBaseProps & {
  /** Remove default wrapper/image styles for fully custom layout. */
  unstyled?: boolean;
  imgStyle?: CSSProperties;
};

export function Artwork({
  className,
  style,
  fallback,
  empty,
  unstyled = false,
  imgStyle,
}: QueueArtworkProps) {
  const state = useGingerMetadataState();
  const src = state.playlistMeta?.artworkUrl;
  if (!src) {
    const node = empty ?? fallback ?? null;
    return node ? (
      <span data-ginger-component="Artwork" className={className} style={style}>
        {node}
      </span>
    ) : null;
  }
  const alt = state.playlistMeta?.title ?? "Playlist artwork";
  return (
    <span
      data-ginger-component="Artwork"
      className={className}
      style={
        unstyled
          ? { ...style }
          : {
              display: "inline-block",
              background: "var(--ginger-artwork-bg, #f3f4f6)",
              borderRadius: "var(--ginger-artwork-radius, 6px)",
              overflow: "hidden",
              ...style,
            }
      }
    >
      <img
        src={src}
        alt={alt}
        style={{
          display: unstyled ? undefined : "block",
          width: unstyled ? undefined : "100%",
          height: unstyled ? undefined : "100%",
          objectFit: unstyled ? undefined : "cover",
          ...imgStyle,
        }}
      />
    </span>
  );
}

Artwork.displayName = "Ginger.Queue.Artwork";
