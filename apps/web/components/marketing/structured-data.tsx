import React from 'react';

export function StructuredData() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AI Visibility OS',
    url: 'https://aivisibilityos.com',
    logo: 'https://aivisibilityos.com/logo.png',
    description:
      'The operating system for measuring and improving how businesses appear across AI platforms.',
    sameAs: ['https://twitter.com/aivisibilityos', 'https://github.com/vineetkpe/ai.visibility.os'],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
