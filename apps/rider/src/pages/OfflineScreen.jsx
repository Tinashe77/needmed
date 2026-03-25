import React from "react";

export const OfflineScreen = () => (
  <section className="status-card offline-card">
    <p className="eyebrow">NeedMed Rider PWA</p>
    <h1>You are offline</h1>
    <p className="support-copy">
      The rider app shell is available, but live delivery requests, status updates, and route sync need a network connection.
    </p>
    <div className="status-box">
      <strong>Offline fallback ready</strong>
      <p>Reconnect to restore dispatch updates and backend actions.</p>
    </div>
  </section>
);
