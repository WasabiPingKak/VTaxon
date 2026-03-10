import 'flag-icons/css/flag-icons.min.css';
import { YouTubeIcon, TwitchIcon, SNS_ICON_MAP, SNS_LABELS } from './SnsIcons';

/** Links row: OAuth icons + SNS icons + flag icons */
export default function LinksRow({ oauthAccounts, socialLinks, countryFlags }) {
  const flags = (countryFlags || []);
  const hasOAuth = oauthAccounts.length > 0;
  const snsEntries = Object.entries(socialLinks || {}).filter(([, url]) => url);
  const hasSns = snsEntries.length > 0;
  const hasLinks = hasOAuth || hasSns;

  if (!hasLinks && flags.length === 0) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '8px', flexWrap: 'wrap',
    }}>
      {oauthAccounts.map(a => {
        const Icon = a.provider === 'youtube' ? YouTubeIcon
          : a.provider === 'twitch' ? TwitchIcon : null;
        if (!Icon) return null;
        return a.channel_url ? (
          <a key={a.id} href={a.channel_url} target="_blank" rel="noopener noreferrer"
            title={`${a.provider_display_name || a.provider} 頻道`}
            style={{ display: 'inline-flex', lineHeight: 0 }}>
            <Icon size={18} />
          </a>
        ) : (
          <span key={a.id} title={a.provider_display_name || a.provider}
            style={{ display: 'inline-flex', lineHeight: 0, opacity: 0.5 }}>
            <Icon size={18} />
          </span>
        );
      })}

      {hasOAuth && hasSns && (
        <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 2px' }}>|</span>
      )}

      {snsEntries
        .sort(([a], [b]) => (a === 'email') - (b === 'email'))
        .map(([key, url]) => {
        const Icon = SNS_ICON_MAP[key];
        if (!Icon) return null;
        const isEmail = key === 'email';
        const href = isEmail && !url.startsWith('mailto:') ? `mailto:${url}` : url;
        return (
          <a key={key} href={href} target={isEmail ? undefined : '_blank'} rel={isEmail ? undefined : 'noopener noreferrer'}
            title={SNS_LABELS[key] || key}
            style={{ display: 'inline-flex', lineHeight: 0 }}>
            <Icon size={18} />
          </a>
        );
      })}

      {flags.length > 0 && (
        <>
          {hasLinks && (
            <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 2px' }}>|</span>
          )}
          {flags.map((code, i) => (
            <span
              key={i}
              className={`fi fi-${code.toLowerCase()}`}
              title={code.toUpperCase()}
              style={{ width: 20, display: 'inline-block', borderRadius: 2 }}
            />
          ))}
        </>
      )}
    </div>
  );
}
