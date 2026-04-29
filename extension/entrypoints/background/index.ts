export default defineBackground(() => {
  console.log('Web Marker background service worker started');

  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      console.log('Web Marker extension installed');
    }
  });
});
