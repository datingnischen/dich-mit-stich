import type { MagazineVideo as MagazineVideoData } from "@/lib/magazine-videos";

type MagazineVideoProps = {
  video: MagazineVideoData;
};

export function MagazineVideo({ video }: MagazineVideoProps) {
  return (
    <section className="content-section magazine-video-card" aria-labelledby="magazine-video-title">
      <div className="magazine-video-copy">
        <span className="eyebrow">Passend zum Artikel</span>
        <h2 id="magazine-video-title">{video.title}</h2>
        <p>{video.description}</p>
      </div>
      <div className="magazine-video-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.videoId}`}
          title={video.embedTitle}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </section>
  );
}
