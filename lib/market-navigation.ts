export type PreviewClick = {
  hostname: string;
  button: number;
  defaultPrevented: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  target: string;
  download: boolean;
};

export function isPreviewHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".vercel.app");
}

export function shouldInterceptPreviewClick(click: PreviewClick) {
  return (
    !click.defaultPrevented &&
    click.button === 0 &&
    !click.metaKey &&
    !click.ctrlKey &&
    !click.shiftKey &&
    !click.altKey &&
    !click.download &&
    (!click.target || click.target === "_self") &&
    isPreviewHost(click.hostname)
  );
}

export function isPrefixFreeInternalPath(href: string) {
  return href.startsWith("/") && !href.startsWith("//") && !/^\/(?:de|at|ch)(?:\/|$)/.test(href);
}
