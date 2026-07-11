module.exports = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    skipAudits: ['uses-http2'],
  },
  assertions: {
    'categories:performance': ['warn', { minScore: 0.7 }],
    'categories:accessibility': ['error', { minScore: 0.9 }],
    'categories:best-practices': ['error', { minScore: 0.85 }],
    'categories:seo': ['warn', { minScore: 0.8 }],
    'first-contentful-paint': ['warn', { maxNumericValue: 3000 }],
    'largest-contentful-paint': ['warn', { maxNumericValue: 5000 }],
    'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
    'total-blocking-time': ['warn', { maxNumericValue: 500 }],
  },
};
