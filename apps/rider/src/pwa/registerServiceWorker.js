export const registerServiceWorker = () => {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // leave registration failure silent in development
      });
    });
  }
};
