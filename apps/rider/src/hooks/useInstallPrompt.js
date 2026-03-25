import React from "react";

export const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = React.useState(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return true;
  };

  return {
    canInstall: Boolean(deferredPrompt) && !dismissed,
    promptInstall,
    dismissInstall: () => setDismissed(true),
  };
};
