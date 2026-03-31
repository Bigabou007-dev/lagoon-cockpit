if (typeof window !== 'undefined') {
  // Inject manifest link
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = '/manifest.json';
  document.head.appendChild(link);

  // Inject theme-color meta
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.content = '#0D0D0D';
  document.head.appendChild(meta);

  // Inject apple-mobile-web-app meta tags for iOS PWA
  const appleMeta = document.createElement('meta');
  appleMeta.name = 'apple-mobile-web-app-capable';
  appleMeta.content = 'yes';
  document.head.appendChild(appleMeta);

  const appleStatus = document.createElement('meta');
  appleStatus.name = 'apple-mobile-web-app-status-bar-style';
  appleStatus.content = 'black-translucent';
  document.head.appendChild(appleStatus);

  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}
