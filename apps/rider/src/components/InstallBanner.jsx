import React from "react";

export const InstallBanner = ({ canInstall, onInstall, onDismiss }) => {
  if (!canInstall) {
    return null;
  }

  return (
    <div className="install-banner">
      <div>
        <strong>Install NeedMed Rider</strong>
        <p>Add the rider workspace to the home screen for faster access and offline shell support.</p>
      </div>
      <div className="install-actions">
        <button type="button" className="secondary-button" onClick={onDismiss}>
          Not now
        </button>
        <button type="button" className="primary-cta" onClick={onInstall}>
          Install app
        </button>
      </div>
    </div>
  );
};
