// Allow importing static assets in TypeScript (images, videos, fonts)
declare module '*.avif';
declare module '*.bmp';
declare module '*.gif';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.png';
declare module '*.webp';
declare module '*.svg' {
  import type { ComponentType, SVGProps } from 'react';
  const ReactComponent: ComponentType<SVGProps<SVGSVGElement>>;
  const src: string;
  export { ReactComponent };
  export default src;
}
declare module '*.mp4';
declare module '*.webm';
declare module '*.wav';
declare module '*.mp3';
declare module '*.m4a';
declare module '*.aac';
declare module '*.woff';
declare module '*.woff2';
declare module '*.eot';
declare module '*.ttf';
declare module '*.otf';

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
