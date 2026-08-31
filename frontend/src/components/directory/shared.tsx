import type { User } from '../../types/models';

/** 目錄項目：User 加上 API 附帶的目錄專用欄位 */
export type DirectoryItem = User & {
  species_names?: string[];
  has_traits?: boolean;
};

/** 活動狀態徽章配色（卡片與列表共用） */
export const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: '活動中', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  hiatus: { label: '休止中', color: '#facc15', bg: 'rgba(250,204,21,0.12)' },
  preparing: { label: '準備中', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
};

/** 平台圖示（卡片用 16px、列表用 14px） */
export function PlatformIcon({ platform, size = 16 }: { platform: string; size?: number }) {
  if (platform === 'youtube') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#f00">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z"/>
      </svg>
    );
  }
  if (platform === 'twitch') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#9146ff">
        <path d="M11.6 11.2V6.8h-1.6v4.4h1.6Zm4.4 0V6.8h-1.6v4.4H16ZM4.8 1 2 4.6V19h5.6v3.4L11 19h3.4L22 11.4V1H4.8Zm15.6 9.8-3.4 3.4h-3.4l-3 3v-3H6.4V2.6h14v8.2Z"/>
      </svg>
    );
  }
  return null;
}
