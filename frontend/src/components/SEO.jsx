import React from 'react';
import Helmet from 'react-helmet';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  image, 
  url, 
  type = 'website',
  publishedTime,
  modifiedTime,
  author = 'Birimengo Ivan'
}) => {
  const siteUrl = 'https://spiroswap.com';
  const defaultImage = `${siteUrl}/og-image.jpg`;
  const siteTitle = 'Spiro Swap Stations';
  const siteDescription = 'Find and navigate to Spiro battery swap stations near you';

  const seo = {
    title: title || siteTitle,
    description: description || siteDescription,
    image: image || defaultImage,
    url: url ? `${siteUrl}${url}` : siteUrl,
    keywords: keywords || 'spiro, battery swap, electric bike, swap station, kampala, uganda'
  };

  return (
    <Helmet>
      {/* Standard metadata */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords} />
      <meta name="author" content={author} />
      
      {/* Open Graph */}
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteTitle} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />
      
      {/* Article specific */}
      {type === 'article' && (
        <>
          <meta property="article:published_time" content={publishedTime} />
          <meta property="article:modified_time" content={modifiedTime} />
          <meta property="article:author" content={author} />
        </>
      )}
      
      {/* Canonical link */}
      <link rel="canonical" href={seo.url} />
    </Helmet>
  );
};

export default SEO;