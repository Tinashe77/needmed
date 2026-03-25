import React from "react";

import { DashboardPage } from "./pages/DashboardPage.jsx";
import { OfflineScreen } from "./pages/OfflineScreen.jsx";
import { AuthPage } from "./pages/AuthPage.jsx";
import { InstallBanner } from "./components/InstallBanner.jsx";
import { apiFetch } from "./services/api.js";
import { connectRiderSocket } from "./services/socket.js";
import { useInstallPrompt } from "./hooks/useInstallPrompt.js";
import { storage } from "./utils/storage.js";

const App = () => {
  const [mode, setMode] = React.useState("login");
  const [form, setForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [session, setSession] = React.useState(() => storage.get("needmed-rider-session"));
  const [deliveries, setDeliveries] = React.useState([]);
  const [availableDeliveries, setAvailableDeliveries] = React.useState([]);
  const [deliveryHistory, setDeliveryHistory] = React.useState([]);
  const [deliveryNotes, setDeliveryNotes] = React.useState({});
  const [deliveryOtp, setDeliveryOtp] = React.useState({});
  const [proofPhotoData, setProofPhotoData] = React.useState({});
  const [proofPhotoName, setProofPhotoName] = React.useState({});
  const [proofOfDelivery, setProofOfDelivery] = React.useState({});
  const [codCollected, setCodCollected] = React.useState({});
  const [codAmountCollected, setCodAmountCollected] = React.useState({});
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isOnline, setIsOnline] = React.useState(() => navigator.onLine);
  const [isRestoringSession, setIsRestoringSession] = React.useState(() => Boolean(storage.get("needmed-rider-session")));
  const [riderLocation, setRiderLocation] = React.useState(null);

  const { canInstall, dismissInstall, promptInstall } = useInstallPrompt();
  const token = session?.token;
  const socketRef = React.useRef(null);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  React.useEffect(() => {
    if (!session?.token || !("geolocation" in navigator)) {
      setRiderLocation(null);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setRiderLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => {
        setRiderLocation(null);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [session?.token]);

  React.useEffect(() => {
    storage.set("needmed-rider-session", session);
  }, [session]);

  React.useEffect(() => {
    if (!session?.token) {
      setIsRestoringSession(false);
      return;
    }

    let cancelled = false;

    const restoreSession = async () => {
      try {
        const data = await apiFetch("/auth/me", {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        });

        if (!cancelled) {
          setSession((current) => (current ? { ...current, user: data.user } : current));
        }
      } catch {
        if (!cancelled) {
          setSession(null);
          storage.remove("needmed-rider-session");
        }
      } finally {
        if (!cancelled) {
          setIsRestoringSession(false);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [session?.token]);

  const loadDeliveries = React.useCallback(async (currentToken) => {
    if (!currentToken) {
      setDeliveries([]);
      return;
    }

    const data = await apiFetch("/deliveries/rider", {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    setDeliveries(data.deliveries);
  }, []);

  const loadAvailableDeliveries = React.useCallback(async (currentToken) => {
    if (!currentToken) {
      setAvailableDeliveries([]);
      return;
    }

    const data = await apiFetch("/deliveries/rider/available", {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    setAvailableDeliveries(data.deliveries);
  }, []);

  const loadDeliveryHistory = React.useCallback(async (currentToken) => {
    if (!currentToken) {
      setDeliveryHistory([]);
      return;
    }

    const data = await apiFetch("/deliveries/rider/history", {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    setDeliveryHistory(data.deliveries);
  }, []);

  React.useEffect(() => {
    if (token) {
      Promise.all([loadDeliveries(token), loadAvailableDeliveries(token), loadDeliveryHistory(token)]).catch((loadError) => {
        setError(loadError.message);
      });
    }
  }, [loadAvailableDeliveries, loadDeliveries, loadDeliveryHistory, token]);

  React.useEffect(() => {
    if (!token || session?.user?.riderAvailability !== "online") {
      return;
    }

    const interval = window.setInterval(() => {
      Promise.all([loadAvailableDeliveries(token), loadDeliveries(token), loadDeliveryHistory(token)]).catch(() => {
        // keep polling resilient
      });
    }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadAvailableDeliveries, loadDeliveries, loadDeliveryHistory, session?.user?.riderAvailability, token]);

  React.useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = connectRiderSocket(token);
    socketRef.current = socket;

    const refreshAll = () =>
      Promise.all([loadDeliveries(token), loadAvailableDeliveries(token), loadDeliveryHistory(token)]).catch(() => {
        // tolerate transient socket-triggered refresh failures
      });

    socket.on("connect", () => {
      socket.emit("rider:status:update", {
        status: session?.user?.riderAvailability ?? "offline",
      });
    });

    socket.on("delivery:new_request", async () => {
      setMessage("New delivery request received.");
      await loadAvailableDeliveries(token);
    });

    socket.on("delivery:assigned", async () => {
      setMessage("A delivery has been assigned to you.");
      await refreshAll();
    });

    socket.on("delivery:accepted", async () => {
      await loadAvailableDeliveries(token);
    });

    socket.on("delivery:rejected", async () => {
      await loadAvailableDeliveries(token);
    });

    socket.on("delivery:status_updated", async () => {
      await refreshAll();
    });

    socket.on("rider:status:updated", (payload) => {
      if (payload.riderId === session?.user?.id) {
        setSession((current) =>
          current
            ? {
                ...current,
                user: {
                  ...current.user,
                  riderAvailability: payload.riderAvailability,
                  riderLastActiveAt: payload.riderLastActiveAt,
                },
              }
            : current,
        );
      }
    });

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [loadAvailableDeliveries, loadDeliveries, loadDeliveryHistory, session?.user?.id, session?.user?.riderAvailability, token]);

  React.useEffect(() => {
    if (!socketRef.current || !riderLocation) {
      return;
    }

    socketRef.current.emit("rider:location:update", riderLocation);
  }, [riderLocation]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const data = await apiFetch(mode === "register" ? "/auth/riders/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(
          mode === "register"
            ? form
            : {
                email: form.email,
                password: form.password,
              },
        ),
      });

      if (mode === "login") {
        setSession(data);
        setResult(data.user);
        setMessage("Rider session restored.");
        await Promise.all([loadDeliveries(data.token), loadAvailableDeliveries(data.token), loadDeliveryHistory(data.token)]);
      } else {
        setResult(data.user);
        setMessage("Registration submitted. Wait for approval before signing in.");
        setMode("login");
      }
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const handleDeliveryStatusUpdate = async (deliveryId, status) => {
    setError("");
    setMessage("");

    try {
      await apiFetch(`/deliveries/rider/${deliveryId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          notes: deliveryNotes[deliveryId] || "",
          deliveryOtp: deliveryOtp[deliveryId] || "",
          proofPhotoData: proofPhotoData[deliveryId] || "",
          proofPhotoName: proofPhotoName[deliveryId] || "",
          proofOfDelivery: proofOfDelivery[deliveryId] || "",
          codCollected: Boolean(codCollected[deliveryId]),
          codAmountCollected: Number(codAmountCollected[deliveryId] || 0),
        }),
      });

      setMessage("Delivery updated successfully.");
      await Promise.all([loadDeliveries(token), loadAvailableDeliveries(token), loadDeliveryHistory(token)]);
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const handleAcceptDelivery = async (deliveryId) => {
    setError("");
    setMessage("");

    try {
      await apiFetch(`/deliveries/rider/${deliveryId}/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage("Delivery request accepted.");
      await Promise.all([loadDeliveries(token), loadAvailableDeliveries(token), loadDeliveryHistory(token)]);
    } catch (acceptError) {
      setError(acceptError.message);
    }
  };

  const handleRejectDelivery = async (deliveryId) => {
    setError("");
    setMessage("");

    try {
      await apiFetch(`/deliveries/rider/${deliveryId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage("Delivery request rejected.");
      await loadAvailableDeliveries(token);
    } catch (rejectError) {
      setError(rejectError.message);
    }
  };

  const handleAvailabilityToggle = async (nextStatus) => {
    if (!token) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const data = await apiFetch("/auth/rider/availability", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      setSession((current) => (current ? { ...current, user: data.user } : current));
      socketRef.current?.emit("rider:status:update", { status: nextStatus });
      setMessage(`Rider status set to ${nextStatus}.`);
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setDeliveries([]);
    setAvailableDeliveries([]);
    setDeliveryHistory([]);
    setMessage("");
    setError("");
    storage.remove("needmed-rider-session");
  };

  React.useEffect(() => {
    if (!token || !session?.user || isOnline) {
      return;
    }

    if (session.user.riderAvailability !== "offline") {
      handleAvailabilityToggle("offline");
    }
  }, [isOnline, session?.user, token]);

  if (isRestoringSession) {
    return (
      <main className="rider-shell">
        <section className="status-card auth-card">
          <p className="eyebrow">NeedMed Rider PWA</p>
          <h1>Restoring session</h1>
          <p className="support-copy">Checking your rider access and loading the delivery workspace.</p>
        </section>
      </main>
    );
  }

  if (!isOnline && !session) {
    return <OfflineScreen />;
  }

  return (
    <main className="rider-shell">
      <InstallBanner canInstall={canInstall} onInstall={promptInstall} onDismiss={dismissInstall} />

      {!isOnline ? <div className="network-banner">Offline mode: cached shell available, live delivery actions paused.</div> : null}

      {session ? (
        <DashboardPage
          session={session}
          isNetworkOnline={isOnline}
          riderLocation={riderLocation}
          availableDeliveries={availableDeliveries}
          deliveries={deliveries}
          deliveryHistory={deliveryHistory}
          deliveryNotes={deliveryNotes}
          deliveryOtp={deliveryOtp}
          proofPhotoData={proofPhotoData}
          proofPhotoName={proofPhotoName}
          proofOfDelivery={proofOfDelivery}
          codCollected={codCollected}
          codAmountCollected={codAmountCollected}
          message={message}
          error={error}
          onLogout={handleLogout}
          onRefresh={() => Promise.all([loadDeliveries(token), loadAvailableDeliveries(token), loadDeliveryHistory(token)])}
          onToggleAvailability={handleAvailabilityToggle}
          onAcceptDelivery={handleAcceptDelivery}
          onRejectDelivery={handleRejectDelivery}
          onSetDeliveryNotes={setDeliveryNotes}
          onSetDeliveryOtp={setDeliveryOtp}
          onSetProofPhotoData={setProofPhotoData}
          onSetProofPhotoName={setProofPhotoName}
          onSetProofOfDelivery={setProofOfDelivery}
          onSetCodCollected={setCodCollected}
          onSetCodAmountCollected={setCodAmountCollected}
          onUpdateDeliveryStatus={handleDeliveryStatusUpdate}
        />
      ) : (
        <AuthPage
          mode={mode}
          form={form}
          result={result}
          message={message}
          error={error}
          onModeChange={setMode}
          onFormChange={setForm}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  );
};

export default App;
