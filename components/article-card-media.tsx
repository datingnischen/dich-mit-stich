import Image from "next/image";

type ArticleCardMediaProps = {
  imageUrl?: string;
  alt: string;
  fallbackLabel: string;
  fallbackTitle: string;
  className?: string;
  sizes?: string;
};

export function ArticleCardMedia({
  imageUrl,
  alt,
  fallbackLabel,
  fallbackTitle,
  className = "",
  sizes = "(max-width: 760px) 100vw, 520px",
}: ArticleCardMediaProps) {
  const mediaClassName = `article-card-media ${className}`.trim();

  if (imageUrl) {
    return (
      <div className={mediaClassName}>
        <Image src={imageUrl} alt={alt} width={720} height={405} sizes={sizes} />
      </div>
    );
  }

  return (
    <div className={`${mediaClassName} article-card-media-fallback`} aria-hidden="true">
      <span>{fallbackLabel}</span>
      <strong>{fallbackTitle}</strong>
    </div>
  );
}
