import React from "react";
import { LiveRouteMap } from "../components/LiveRouteMap.jsx";

const statusLabel = (status) =>
  String(status)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const navItems = [
  { id: "deliveries", label: "Deliveries", icon: "truck" },
  { id: "map", label: "Map", icon: "map" },
  { id: "history", label: "History", icon: "history" },
  { id: "account", label: "Account", icon: "account" },
];

const iconFor = (icon) => {
  switch (icon) {
    case "truck":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6h11v8H3zM14 9h3l3 3v2h-6zM7 18a1.5 1.5 0 1 0 0 .01M17 18a1.5 1.5 0 1 0 0 .01" />
        </svg>
      );
    case "map":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 2.2 4 1.34v10.26L9 16.46Zm-2 .12v10.14l-2 .66V6.98Zm12 .56v10.14l-2 .66V7.54Z" />
        </svg>
      );
    case "history":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 6v6l4 2M4 12a8 8 0 1 0 2.34-5.66M4 4v4h4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />
        </svg>
      );
  }
};

const initialsFor = (user) =>
  `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.trim().toUpperCase() || "R";

const taskLabelFor = (delivery) => {
  switch (delivery?.status) {
    case "ASSIGNED":
      return "New delivery assigned";
    case "ACCEPTED":
      return "Heading to pharmacy";
    case "ARRIVED_AT_PHARMACY":
      return "At pickup point";
    case "PICKED_UP":
      return "Collected and ready";
    case "IN_TRANSIT":
    case "OUT_FOR_DELIVERY":
      return "On the way to drop-off";
    case "DELIVERED":
      return "Delivery completed";
    case "FAILED":
      return "Delivery failed";
    default:
      return "Awaiting dispatch";
  }
};

const statusToneClass = (status) => `status-${String(status || "offline").toLowerCase()}`;

export const DashboardPage = ({
  session,
  isNetworkOnline,
  riderLocation,
  availableDeliveries,
  deliveries,
  deliveryHistory,
  deliveryNotes,
  deliveryOtp,
  proofPhotoData,
  proofPhotoName,
  proofOfDelivery,
  codCollected,
  codAmountCollected,
  message,
  error,
  onLogout,
  onRefresh,
  onToggleAvailability,
  onAcceptDelivery,
  onRejectDelivery,
  onSetDeliveryNotes,
  onSetDeliveryOtp,
  onSetProofPhotoData,
  onSetProofPhotoName,
  onSetProofOfDelivery,
  onSetCodCollected,
  onSetCodAmountCollected,
  onUpdateDeliveryStatus,
}) => {
  const [activeTab, setActiveTab] = React.useState("deliveries");

  const activeDelivery =
    deliveries.find((delivery) => ["IN_TRANSIT", "OUT_FOR_DELIVERY", "PICKED_UP", "ARRIVED_AT_PHARMACY", "ACCEPTED", "ASSIGNED"].includes(delivery.status)) ||
    deliveries[0] ||
    null;

  const deliveredCount = deliveryHistory.filter((delivery) => delivery.status === "DELIVERED").length;

  const getGoogleDirectionsUrl = (delivery) => {
    const destination = encodeURIComponent(delivery.deliveryAddress);

    if (riderLocation) {
      return `https://www.google.com/maps/dir/?api=1&origin=${riderLocation.latitude},${riderLocation.longitude}&destination=${destination}&travelmode=driving`;
    }

    return `https://www.google.com/maps/search/?api=1&query=${destination}`;
  };

  const getOpenStreetMapUrl = (delivery) => {
    const destination = encodeURIComponent(delivery.deliveryAddress);
    return `https://www.openstreetmap.org/search?query=${destination}`;
  };

  const showTransitMap = (delivery) => ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(delivery.status);

  const handlePhotoSelect = (deliveryId, file) => {
    if (!file) {
      onSetProofPhotoData((current) => ({ ...current, [deliveryId]: "" }));
      onSetProofPhotoName((current) => ({ ...current, [deliveryId]: "" }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onSetProofPhotoData((current) => ({
        ...current,
        [deliveryId]: String(reader.result || ""),
      }));
      onSetProofPhotoName((current) => ({
        ...current,
        [deliveryId]: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const renderRequestCard = (delivery) => (
    <article key={delivery._id} className="mobile-card request-card">
      <div className="mobile-card-head">
        <div>
          <p className="micro-label">Open request</p>
          <h3>{delivery.orderNumber}</h3>
        </div>
        <span className={`status-pill ${statusToneClass(delivery.status)}`}>{statusLabel(delivery.status)}</span>
      </div>

      <div className="request-meta-grid">
        <div>
          <span className="micro-label">Customer</span>
          <strong>{delivery.customerName}</strong>
        </div>
        <div>
          <span className="micro-label">Phone</span>
          <a href={`tel:${delivery.customerPhone}`}>{delivery.customerPhone}</a>
        </div>
      </div>

      <p className="delivery-address compact-address">{delivery.deliveryAddress}</p>

      <div className="action-row">
        <button type="button" className="soft-button danger" onClick={() => onRejectDelivery(delivery._id)}>
          Reject
        </button>
        <button type="button" className="app-button" onClick={() => onAcceptDelivery(delivery._id)}>
          Accept request
        </button>
      </div>
    </article>
  );

  const renderDeliveryCard = (delivery) => {
    const currentStatus = delivery.status;
    const canAccept = currentStatus === "ASSIGNED";
    const canArrive = currentStatus === "ACCEPTED";
    const canPickup = currentStatus === "ARRIVED_AT_PHARMACY";
    const canTransit = currentStatus === "PICKED_UP";
    const canDeliver = ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(currentStatus);
    const codValue = codAmountCollected[delivery._id] ?? delivery.codAmountCollected ?? "";
    const proofValue = proofPhotoName[delivery._id] || delivery.proof?.photoUrl;

    return (
      <article key={delivery._id} className="mobile-card delivery-work-card">
        <div className="mobile-card-head">
          <div>
            <p className="micro-label">Current order</p>
            <h3>{delivery.orderNumber}</h3>
          </div>
          <span className={`status-pill ${statusToneClass(delivery.status)}`}>{statusLabel(delivery.status)}</span>
        </div>

        <div className="current-task-banner">
          <div>
            <p className="micro-label accent">Current task</p>
            <strong>{taskLabelFor(delivery)}</strong>
          </div>
          <span className="live-chip">{isNetworkOnline ? "Live" : "Offline"}</span>
        </div>

        <div className="customer-focus-card">
          <div className="customer-focus-text">
            <span className="micro-label">Customer</span>
            <strong>{delivery.customerName}</strong>
            <p>{delivery.deliveryAddress}</p>
          </div>
          <div className="customer-focus-actions">
            <a className="icon-action" href={`tel:${delivery.customerPhone}`} aria-label={`Call ${delivery.customerName}`}>
              <span>Call</span>
            </a>
            <a className="icon-action" href={`sms:${delivery.customerPhone}`} aria-label={`Text ${delivery.customerName}`}>
              <span>Text</span>
            </a>
          </div>
        </div>

        <div className="field-stack">
          <textarea
            className="delivery-input"
            placeholder="Progress notes"
            value={deliveryNotes[delivery._id] ?? delivery.notes ?? ""}
            onChange={(event) =>
              onSetDeliveryNotes((current) => ({
                ...current,
                [delivery._id]: event.target.value,
              }))
            }
          />

          <input
            className="delivery-input"
            placeholder="Proof of delivery reference"
            value={proofOfDelivery[delivery._id] ?? delivery.proofOfDelivery ?? ""}
            onChange={(event) =>
              onSetProofOfDelivery((current) => ({
                ...current,
                [delivery._id]: event.target.value,
              }))
            }
          />

          <div className="two-up-fields">
            <input
              className="delivery-input"
              placeholder="Customer OTP"
              value={deliveryOtp[delivery._id] ?? ""}
              onChange={(event) =>
                onSetDeliveryOtp((current) => ({
                  ...current,
                  [delivery._id]: event.target.value,
                }))
              }
            />

            {delivery.paymentMethod === "cash_on_delivery" ? (
              <input
                className="delivery-input"
                placeholder={`COD amount${delivery.codAmountDue ? ` (${delivery.codAmountDue})` : ""}`}
                value={codValue}
                onChange={(event) =>
                  onSetCodAmountCollected((current) => ({
                    ...current,
                    [delivery._id]: event.target.value,
                  }))
                }
              />
            ) : null}
          </div>

          <label className="upload-panel">
            <div>
              <span className="micro-label">Photo proof</span>
              <strong>{proofValue ? "Attachment ready" : "Capture proof image"}</strong>
            </div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => handlePhotoSelect(delivery._id, event.target.files?.[0])}
            />
            {proofValue ? <small>{proofPhotoName[delivery._id] || "Existing photo proof attached"}</small> : null}
          </label>

          {delivery.paymentMethod === "cash_on_delivery" ? (
            <label className="checkline">
              <input
                type="checkbox"
                checked={codCollected[delivery._id] ?? delivery.codCollected ?? false}
                onChange={(event) =>
                  onSetCodCollected((current) => ({
                    ...current,
                    [delivery._id]: event.target.checked,
                  }))
                }
              />
              Cash on delivery collected
            </label>
          ) : null}
        </div>

        <div className="workflow-actions">
          {canAccept ? (
            <button type="button" className="app-button secondary" onClick={() => onUpdateDeliveryStatus(delivery._id, "ACCEPTED")}>
              Accept
            </button>
          ) : null}
          {canArrive ? (
            <button
              type="button"
              className="app-button secondary"
              onClick={() => onUpdateDeliveryStatus(delivery._id, "ARRIVED_AT_PHARMACY")}
            >
              Arrived at pharmacy
            </button>
          ) : null}
          {canPickup ? (
            <button type="button" className="app-button secondary" onClick={() => onUpdateDeliveryStatus(delivery._id, "PICKED_UP")}>
              Collected order
            </button>
          ) : null}
          {canTransit ? (
            <button type="button" className="app-button secondary" onClick={() => onUpdateDeliveryStatus(delivery._id, "IN_TRANSIT")}>
              In transit
            </button>
          ) : null}
          {canDeliver ? (
            <button type="button" className="app-button finish" onClick={() => onUpdateDeliveryStatus(delivery._id, "DELIVERED")}>
              Finish delivery
            </button>
          ) : null}
          {currentStatus !== "DELIVERED" && currentStatus !== "FAILED" ? (
            <button type="button" className="text-danger" onClick={() => onUpdateDeliveryStatus(delivery._id, "FAILED")}>
              Issue report
            </button>
          ) : null}
        </div>
      </article>
    );
  };

  return (
    <section className="rider-dashboard">
      {message ? <p className="success mobile-banner">{message}</p> : null}
      {error ? <p className="error mobile-banner">{error}</p> : null}

      <div className="app-phone-frame">
        <header className="mobile-topbar">
          <button type="button" className="chrome-button" onClick={onRefresh} aria-label="Refresh rider dashboard">
            <span />
            <span />
            <span />
          </button>

          <div className="mobile-title-block">
            <p className="micro-label accent">NeedMed Rider</p>
            <h1>{activeDelivery ? taskLabelFor(activeDelivery) : "Rider portal"}</h1>
          </div>

          <div className="profile-avatar" aria-hidden="true">
            {initialsFor(session.user)}
          </div>
        </header>

        <section className="map-stage">
          <div className="map-grid" />
          <div className="stage-overlay" />

          <article className="hero-order-card">
            <div className="mobile-card-head">
              <div>
                <p className="micro-label">Current order</p>
                <h2>{activeDelivery ? activeDelivery.orderNumber : "No active route"}</h2>
              </div>
              <span className={`status-pill ${statusToneClass(session.user.riderAvailability)}`}>
                {statusLabel(session.user.riderAvailability || "offline")}
              </span>
            </div>

            <div className="hero-order-row">
              <div className="timeline-dot" />
              <div className="hero-order-copy">
                <span className="micro-label">Drop-off point</span>
                <strong>{activeDelivery ? activeDelivery.deliveryAddress : "Waiting for dispatch to assign the next route."}</strong>
              </div>
              {activeDelivery ? (
                <a className="hero-nav-button" href={getGoogleDirectionsUrl(activeDelivery)} target="_blank" rel="noreferrer">
                  Go
                </a>
              ) : null}
            </div>
          </article>

          <div className="map-fab-stack">
            <button type="button" className="map-fab" onClick={onRefresh} aria-label="Refresh">
              ◎
            </button>
            {activeDelivery ? (
              <a className="map-fab" href={getOpenStreetMapUrl(activeDelivery)} target="_blank" rel="noreferrer" aria-label="Open map">
                +
              </a>
            ) : (
              <button type="button" className="map-fab" disabled aria-label="Map unavailable">
                +
              </button>
            )}
          </div>
        </section>

        <section className="bottom-sheet">
          <div className="sheet-handle" />

          {activeDelivery ? (
            <article className="mobile-card task-hero-card">
              <div className="mobile-card-head">
                <div>
                  <p className="micro-label accent">Current task</p>
                  <h2>{taskLabelFor(activeDelivery)}</h2>
                </div>
                <span className="live-chip">{isNetworkOnline ? "Live" : "Paused"}</span>
              </div>

              <div className="task-customer-card">
                <div className="customer-icon-block">⌂</div>
                <div className="task-customer-copy">
                  <span className="micro-label">Customer</span>
                  <strong>{activeDelivery.customerName}</strong>
                  <p>{activeDelivery.customerPhone}</p>
                </div>
                <div className="task-customer-actions">
                  <a className="icon-action small" href={`sms:${activeDelivery.customerPhone}`}>
                    Text
                  </a>
                  <a className="icon-action small strong" href={`tel:${activeDelivery.customerPhone}`}>
                    Call
                  </a>
                </div>
              </div>

              {["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(activeDelivery.status) ? (
                <button type="button" className="app-button finish" onClick={() => setActiveTab("map")}>
                  Open live route
                </button>
              ) : null}
            </article>
          ) : (
            <article className="mobile-card task-hero-card idle">
              <p className="micro-label accent">Status</p>
              <h2>No active route</h2>
              <p className="muted-copy">Stay online to receive new delivery requests in real time.</p>
            </article>
          )}

          {activeTab === "deliveries" ? (
            <div className="tab-panel">
              <section className="quick-metrics">
                <article className="metric-card">
                  <span className="micro-label">Open requests</span>
                  <strong>{availableDeliveries.length}</strong>
                  <p>Units</p>
                </article>
                <article className="metric-card">
                  <span className="micro-label">Assigned</span>
                  <strong>{deliveries.length}</strong>
                  <p>Orders</p>
                </article>
              </section>

              {availableDeliveries.length ? (
                <section className="stack-section">
                  <div className="panel-title-row">
                    <h2>Open requests</h2>
                    <span>{availableDeliveries.length}</span>
                  </div>
                  <div className="card-stack">{availableDeliveries.map(renderRequestCard)}</div>
                </section>
              ) : null}

              <section className="stack-section">
                <div className="panel-title-row">
                  <h2>Assigned deliveries</h2>
                  <span>{deliveries.length}</span>
                </div>
                {deliveries.length === 0 ? <p className="empty-state app-empty">No deliveries are assigned to you yet.</p> : null}
                <div className="card-stack">{deliveries.map(renderDeliveryCard)}</div>
              </section>
            </div>
          ) : null}

          {activeTab === "map" ? (
            <div className="tab-panel">
              <section className="stack-section">
                <div className="panel-title-row">
                  <h2>Active route</h2>
                  <span>{activeDelivery ? statusLabel(activeDelivery.status) : "Idle"}</span>
                </div>

                {activeDelivery && showTransitMap(activeDelivery) ? (
                  <>
                    <div className="route-chip-grid">
                      <article className="route-chip">
                        <span className="micro-label">Current location</span>
                        <strong>
                          {riderLocation
                            ? `${riderLocation.latitude.toFixed(5)}, ${riderLocation.longitude.toFixed(5)}`
                            : "Location unavailable"}
                        </strong>
                      </article>
                      <article className="route-chip">
                        <span className="micro-label">Destination</span>
                        <strong>{activeDelivery.deliveryAddress}</strong>
                      </article>
                    </div>

                    <div className="embedded-map-card">
                      <LiveRouteMap deliveryAddress={activeDelivery.deliveryAddress} riderLocation={riderLocation} />
                    </div>

                    <div className="action-row">
                      <a className="app-button" href={getGoogleDirectionsUrl(activeDelivery)} target="_blank" rel="noreferrer">
                        Open Google Maps
                      </a>
                      <a className="soft-button" href={getOpenStreetMapUrl(activeDelivery)} target="_blank" rel="noreferrer">
                        OSM Route
                      </a>
                    </div>
                  </>
                ) : (
                  <article className="mobile-card idle-map-card">
                    <p className="micro-label accent">Map</p>
                    <h3>Route appears after pickup</h3>
                    <p className="muted-copy">Collect the order and mark it in transit to unlock the live route panel.</p>
                  </article>
                )}
              </section>
            </div>
          ) : null}

          {activeTab === "history" ? (
            <div className="tab-panel">
              <section className="stack-section">
                <div className="panel-title-row">
                  <h2>Delivery history</h2>
                  <span>{deliveryHistory.length}</span>
                </div>
                {deliveryHistory.length === 0 ? <p className="empty-state app-empty">No delivery history yet.</p> : null}
                <div className="card-stack">
                  {deliveryHistory.map((delivery) => (
                    <article key={delivery._id} className="mobile-card history-entry-card">
                      <div className="mobile-card-head">
                        <div>
                          <p className="micro-label">Order ID</p>
                          <h3>{delivery.orderNumber}</h3>
                        </div>
                        <span className={`status-pill ${statusToneClass(delivery.status)}`}>{statusLabel(delivery.status)}</span>
                      </div>

                      <div className="history-row">
                        <span className="history-pin">⌖</span>
                        <strong>{delivery.deliveryAddress}</strong>
                      </div>

                      <div className="history-proof-row">
                        <span>Proof: {delivery.proof?.method ? statusLabel(delivery.proof.method) : "None"}</span>
                        {delivery.proof?.photoUrl ? (
                          <a href={`http://127.0.0.1:5001${delivery.proof.photoUrl}`} target="_blank" rel="noreferrer">
                            View photo
                          </a>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === "account" ? (
            <div className="tab-panel">
              <article className="mobile-card account-card">
                <div className="account-head">
                  <div className="profile-avatar large" aria-hidden="true">
                    {initialsFor(session.user)}
                  </div>
                  <div>
                    <h2>
                      {session.user.firstName} {session.user.lastName}
                    </h2>
                    <p>{session.user.email}</p>
                  </div>
                </div>

                <div className="account-status-row">
                  <span className={`status-pill ${statusToneClass(session.user.riderAvailability)}`}>
                    {statusLabel(session.user.riderAvailability || "offline")}
                  </span>
                  <span className={`status-pill ${isNetworkOnline ? "status-online" : "status-failed"}`}>
                    {isNetworkOnline ? "Network Online" : "Network Offline"}
                  </span>
                </div>

                <div className="action-grid">
                  <button
                    type="button"
                    className="soft-button"
                    onClick={() =>
                      onToggleAvailability(session.user.riderAvailability === "online" ? "offline" : "online")
                    }
                    disabled={!isNetworkOnline}
                  >
                    {session.user.riderAvailability === "online" ? "Go offline" : "Go online"}
                  </button>
                  <button type="button" className="soft-button" onClick={onRefresh}>
                    Refresh
                  </button>
                  <button type="button" className="soft-button danger" onClick={onLogout}>
                    Logout
                  </button>
                </div>
              </article>

              <section className="quick-metrics">
                <article className="metric-card wide">
                  <span className="micro-label">Current zone</span>
                  <strong>Avondale</strong>
                  <p>{riderLocation ? "Live coordinates available" : "Waiting for location permission"}</p>
                </article>
                <article className="metric-card">
                  <span className="micro-label">Delivered</span>
                  <strong>{deliveredCount}</strong>
                  <p>Completed</p>
                </article>
              </section>
            </div>
          ) : null}
        </section>

        <nav className="bottom-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeTab === item.id ? "bottom-nav-item active" : "bottom-nav-item"}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{iconFor(item.icon)}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
};
