import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'VTaxon';
const SITE_URL = 'https://vtaxon.web.app';
const DEFAULT_DESCRIPTION = 'VTaxon — 將 VTuber 角色形象對應到生物分類學體系，以分類樹呈現角色之間的關聯。';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_OG_IMAGE,
  url,
  type = 'website',
  noindex = false,
  jsonLd,
  children,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonicalUrl = url ? `${SITE_URL}${url}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="zh_TW" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />

      {/* JSON-LD */}
      {jsonLd && (Array.isArray(jsonLd)
        ? jsonLd.map((item, i) => (
            <script key={i} type="application/ld+json">
              {JSON.stringify(item)}
            </script>
          ))
        : (
            <script type="application/ld+json">
              {JSON.stringify(jsonLd)}
            </script>
          )
      )}

      {children}
    </Helmet>
  );
}

export { SITE_URL, SITE_NAME };
