import React from "react";
import ReactDOM from "react-dom/client";

import "./styles.css";
import { connectAdminSocket } from "./services/socket.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://needmed.onrender.com";
const API_URL = `${API_BASE_URL}/api`;
const USER_SECTIONS = ["customers", "internal", "riders"];
const SECTIONS = ["overview", ...USER_SECTIONS, "pharmacies", "products", "prescriptions", "consultations", "orders", "payments", "deliveries"];

const NAV_GROUPS = [
  { label: "Dashboard", items: ["overview"] },
  { label: "User Management", items: USER_SECTIONS },
  { label: "Operations", items: ["pharmacies", "products", "prescriptions", "consultations", "orders", "payments", "deliveries"] },
];

const NAV_ICONS = {
  overview: "◈",
  customers: "◉",
  internal: "◈",
  riders: "◎",
  pharmacies: "⬡",
  products: "◌",
  prescriptions: "◍",
  consultations: "◒",
  orders: "◎",
  payments: "◐",
  deliveries: "◔",
};

const groupLabel = {
  overview: "Overview",
  customers: "Customers",
  internal: "Internal Users",
  riders: "Riders",
  pharmacies: "Pharmacies & Branches",
  products: "Products & Inventory",
  prescriptions: "Prescriptions",
  consultations: "WhatsApp Consultations",
  orders: "Orders",
  payments: "Payments",
  deliveries: "Deliveries",
};

const STATUS_TONE = {
  active: "success",
  inactive: "muted",
  suspended: "danger",
  pending: "warning",
  pending_approval: "warning",
  intake_in_progress: "warning",
  ready_for_review: "info",
  in_review: "accent",
  waiting_for_customer: "warning",
  approved: "success",
  rejected: "danger",
  requires_follow_up: "warning",
  visible: "info",
  hidden: "muted",
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "danger",
  paid: "success",
  failed: "danger",
  refunded: "muted",
  partially_refunded: "warning",
  draft: "muted",
  pending_payment: "warning",
  pending_pharmacy_review: "warning",
  partially_available: "warning",
  preparing: "info",
  ready_for_dispatch: "info",
  out_for_delivery: "accent",
  delivered: "success",
  cancelled: "muted",
  failed_delivery: "danger",
  assigned: "info",
  accepted: "info",
  arrived_at_pharmacy: "info",
  picked_up: "accent",
  cash_on_delivery: "info",
  online: "accent",
  delivery: "accent",
  pickup: "muted",
  admin: "accent",
  pharmacist: "info",
  pharmacy_staff: "muted",
  customer: "success",
  rider: "warning",
};

const emptyUserForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  role: "pharmacy_staff",
  accountStatus: "active",
  pharmacyId: "",
  branchId: "",
};

const emptyPharmacyForm = {
  name: "",
  slug: "",
  supportEmail: "",
  supportPhone: "",
  isActive: true,
};

const emptyBranchForm = {
  pharmacyId: "",
  name: "",
  code: "",
  addressLine1: "",
  city: "",
  country: "Zimbabwe",
  isActive: true,
};

const emptyProductForm = {
  name: "",
  genericName: "",
  brand: "",
  category: "",
  description: "",
  dosageInformation: "",
  unitType: "",
  price: "",
  sku: "",
  prescriptionOnly: false,
  warnings: "",
  isActive: true,
};

const emptyInventoryForm = {
  productId: "",
  branchId: "",
  stockQuantity: "",
  reorderThreshold: "",
  visibilityStatus: "visible",
};

const emptyPrescriptionReviewForm = {
  prescriptionId: "",
  reviewStatus: "approved",
  pharmacistNotes: "",
};

const emptyOrderUpdateForm = {
  orderId: "",
  status: "APPROVED",
  notes: "",
};

const emptyConsultationStatusForm = {
  consultationId: "",
  status: "in_review",
  pharmacistNotes: "",
};

const emptyConsultationReplyForm = {
  consultationId: "",
  body: "",
  status: "waiting_for_customer",
  pharmacistNotes: "",
};

const emptyPaymentUpdateForm = {
  paymentId: "",
  status: "paid",
  notes: "",
};

const emptyDeliveryCreateForm = {
  orderId: "",
};

const emptyDeliveryManageForm = {
  deliveryId: "",
  riderId: "",
  status: "ASSIGNED",
  notes: "",
  deliveryOtp: "",
  codAmountCollected: "",
};

const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message ?? "Request failed.");
  }

  return data;
};

const humanize = (value) =>
  String(value ?? "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

const StatusBadge = ({ value }) => {
  const normalized = String(value ?? "").toLowerCase();
  const tone = STATUS_TONE[normalized] ?? "default";

  return <span className={`status-badge ${tone}`}>{humanize(value)}</span>;
};

const Modal = ({ open, title, children, onClose, width = "720px" }) => {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: width }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{title}</h3>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

const TableCard = ({ title, action, children }) => (
  <section className="card table-card">
    <div className="card-header-row">
      <h3>{title}</h3>
      {action}
    </div>
    {children}
  </section>
);

const EmptyState = ({ text }) => <p className="empty-inline">{text}</p>;

const App = () => {
  const [form, setForm] = React.useState({
    email: "admin@needmed.local",
    password: "ChangeMe123!",
  });
  const [session, setSession] = React.useState(null);
  const [section, setSection] = React.useState("overview");
  const [search, setSearch] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [modal, setModal] = React.useState(null);

  const [users, setUsers] = React.useState([]);
  const [pharmacies, setPharmacies] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [prescriptions, setPrescriptions] = React.useState([]);
  const [consultations, setConsultations] = React.useState([]);
  const [orders, setOrders] = React.useState([]);
  const [payments, setPayments] = React.useState([]);
  const [deliveries, setDeliveries] = React.useState([]);

  const [editingUserId, setEditingUserId] = React.useState(null);
  const [userForm, setUserForm] = React.useState(emptyUserForm);

  const [editingPharmacyId, setEditingPharmacyId] = React.useState(null);
  const [pharmacyForm, setPharmacyForm] = React.useState(emptyPharmacyForm);

  const [editingBranch, setEditingBranch] = React.useState(null);
  const [branchForm, setBranchForm] = React.useState(emptyBranchForm);

  const [editingProductId, setEditingProductId] = React.useState(null);
  const [productForm, setProductForm] = React.useState(emptyProductForm);

  const [inventoryForm, setInventoryForm] = React.useState(emptyInventoryForm);
  const [prescriptionFilter, setPrescriptionFilter] = React.useState("all");
  const [prescriptionReviewForm, setPrescriptionReviewForm] = React.useState(emptyPrescriptionReviewForm);
  const [consultationStatusForm, setConsultationStatusForm] = React.useState(emptyConsultationStatusForm);
  const [consultationReplyForm, setConsultationReplyForm] = React.useState(emptyConsultationReplyForm);
  const [orderUpdateForm, setOrderUpdateForm] = React.useState(emptyOrderUpdateForm);
  const [paymentUpdateForm, setPaymentUpdateForm] = React.useState(emptyPaymentUpdateForm);
  const [deliveryCreateForm, setDeliveryCreateForm] = React.useState(emptyDeliveryCreateForm);
  const [deliveryManageForm, setDeliveryManageForm] = React.useState(emptyDeliveryManageForm);
  const [activeConsultation, setActiveConsultation] = React.useState(null);
  const socketRef = React.useRef(null);

  const token = session?.token;

  const loadUsers = React.useCallback(async (currentToken, currentSearch = "") => {
    const params = new URLSearchParams();

    if (currentSearch.trim()) {
      params.set("search", currentSearch.trim());
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await apiFetch(`/auth/admin/users${query}`, {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    setUsers(data.users);
  }, []);

  const loadPharmacies = React.useCallback(async (currentToken) => {
    const data = await apiFetch("/pharmacies", {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    setPharmacies(data.pharmacies);
  }, []);

  const loadProducts = React.useCallback(async (currentToken) => {
    const data = await apiFetch("/products/admin/all", {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    setProducts(data.products);
  }, []);

  const loadPrescriptions = React.useCallback(async (currentToken, reviewStatus = "all") => {
    const query = reviewStatus !== "all" ? `?reviewStatus=${reviewStatus}` : "";
    const data = await apiFetch(`/prescriptions/admin${query}`, {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    setPrescriptions(data.prescriptions);
  }, []);

  const loadConsultations = React.useCallback(async (currentToken) => {
    const data = await apiFetch("/consultations/admin", {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    setConsultations(data.consultations);
  }, []);

  const loadOrders = React.useCallback(async (currentToken) => {
    const data = await apiFetch("/orders/admin", {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    setOrders(data.orders);
  }, []);

  const loadPayments = React.useCallback(async (currentToken) => {
    const data = await apiFetch("/payments/admin", {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    setPayments(data.payments);
  }, []);

  const loadDeliveries = React.useCallback(async (currentToken) => {
    const data = await apiFetch("/deliveries/admin", {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    setDeliveries(data.deliveries);
  }, []);

  const refreshDashboard = React.useCallback(
    async (currentToken, currentSearch = search) => {
      await Promise.all([
        loadUsers(currentToken, currentSearch),
        loadPharmacies(currentToken),
        loadProducts(currentToken),
        loadPrescriptions(currentToken, prescriptionFilter),
        loadConsultations(currentToken),
        loadOrders(currentToken),
        loadPayments(currentToken),
        loadDeliveries(currentToken),
      ]);
    },
    [loadConsultations, loadDeliveries, loadOrders, loadPayments, loadPharmacies, loadPrescriptions, loadProducts, loadUsers, prescriptionFilter, search],
  );

  React.useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = connectAdminSocket(token);
    socketRef.current = socket;

    const refreshAll = () => {
      refreshDashboard(token).catch(() => {
        // tolerate transient realtime refresh failures
      });
    };

    const refreshUsersOnly = () => {
      loadUsers(token, search).catch(() => {
        // tolerate transient realtime refresh failures
      });
    };

    const refreshDeliveriesOnly = () => {
      loadDeliveries(token).catch(() => {
        // tolerate transient realtime refresh failures
      });
    };

    socket.on("delivery:created", refreshAll);
    socket.on("delivery:assigned", refreshAll);
    socket.on("delivery:accepted", refreshAll);
    socket.on("delivery:rejected", refreshAll);
    socket.on("delivery:status_updated", refreshAll);
    socket.on("rider:status:updated", refreshUsersOnly);
    socket.on("rider:connected", refreshUsersOnly);
    socket.on("rider:disconnected", refreshUsersOnly);
    socket.on("rider:location:updated", refreshDeliveriesOnly);

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [loadUsers, refreshDashboard, search, token]);

  const usersBySection = React.useMemo(
    () => ({
      customers: users.filter((user) => user.role === "customer"),
      internal: users.filter((user) => ["admin", "pharmacist", "pharmacy_staff"].includes(user.role)),
      riders: users.filter((user) => user.role === "rider"),
    }),
    [users],
  );

  const activeRiders = React.useMemo(
    () => usersBySection.riders.filter((user) => user.accountStatus === "active"),
    [usersBySection],
  );

  const flattenedBranches = React.useMemo(
    () =>
      pharmacies.flatMap((pharmacy) =>
        pharmacy.branches.map((branch) => ({
          ...branch,
          pharmacyId: pharmacy._id,
          pharmacyName: pharmacy.name,
        })),
      ),
    [pharmacies],
  );

  const branchMap = React.useMemo(
    () => new Map(flattenedBranches.map((branch) => [branch._id, branch])),
    [flattenedBranches],
  );

  const flattenedInventory = React.useMemo(
    () =>
      products.flatMap((product) =>
        (product.inventory || []).map((inventory) => ({
          ...inventory,
          productId: product._id,
          productName: product.name,
          branchName: branchMap.get(inventory.branchId)?.name ?? inventory.branchId,
        })),
      ),
    [branchMap, products],
  );

  const deliveryEligibleOrders = React.useMemo(
    () =>
      orders.filter(
        (order) =>
          order.fulfillmentType === "delivery" &&
          !deliveries.some((delivery) => String(delivery.orderId) === String(order._id)),
      ),
    [deliveries, orders],
  );

  const userBranchOptions = React.useMemo(
    () => flattenedBranches.filter((branch) => branch.pharmacyId === userForm.pharmacyId),
    [flattenedBranches, userForm.pharmacyId],
  );

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setSession(data);
      await refreshDashboard(data.token, "");
    } catch (loginError) {
      setError(loginError.message);
    }
  };

  const closeModal = () => setModal(null);

  const handleSearch = async (event) => {
    const value = event.target.value;
    setSearch(value);

    if (token) {
      await loadUsers(token, value);
    }
  };

  const openUserModal = (user = null, rolePreset = "pharmacy_staff") => {
    setEditingUserId(user?.id ?? null);
    setUserForm(
      user
        ? {
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            email: user.email ?? "",
            phone: user.phone ?? "",
            password: "",
            role: user.role ?? rolePreset,
            accountStatus: user.accountStatus ?? "active",
            pharmacyId: user.pharmacyId ?? "",
            branchId: user.branchId ?? "",
          }
        : {
            ...emptyUserForm,
            role: rolePreset,
          },
    );
    setModal("user");
  };

  const openPharmacyModal = (pharmacy = null) => {
    setEditingPharmacyId(pharmacy?._id ?? null);
    setPharmacyForm(
      pharmacy
        ? {
            name: pharmacy.name ?? "",
            slug: pharmacy.slug ?? "",
            supportEmail: pharmacy.supportEmail ?? "",
            supportPhone: pharmacy.supportPhone ?? "",
            isActive: Boolean(pharmacy.isActive),
          }
        : emptyPharmacyForm,
    );
    setModal("pharmacy");
  };

  const openBranchModal = (branch = null, pharmacyId = "") => {
    setEditingBranch(branch ? { pharmacyId: branch.pharmacyId, branchId: branch._id } : null);
    setBranchForm(
      branch
        ? {
            pharmacyId: branch.pharmacyId,
            name: branch.name ?? "",
            code: branch.code ?? "",
            addressLine1: branch.addressLine1 ?? "",
            city: branch.city ?? "",
            country: branch.country ?? "Zimbabwe",
            isActive: Boolean(branch.isActive),
          }
        : {
            ...emptyBranchForm,
            pharmacyId,
          },
    );
    setModal("branch");
  };

  const openProductModal = (product = null) => {
    setEditingProductId(product?._id ?? null);
    setProductForm(
      product
        ? {
            name: product.name ?? "",
            genericName: product.genericName ?? "",
            brand: product.brand ?? "",
            category: product.category ?? "",
            description: product.description ?? "",
            dosageInformation: product.dosageInformation ?? "",
            unitType: product.unitType ?? "",
            price: String(product.price ?? ""),
            sku: product.sku ?? "",
            prescriptionOnly: Boolean(product.prescriptionOnly),
            warnings: product.warnings ?? "",
            isActive: Boolean(product.isActive),
          }
        : emptyProductForm,
    );
    setModal("product");
  };

  const openInventoryModal = (inventory = null, productId = "") => {
    setInventoryForm(
      inventory
        ? {
            productId: inventory.productId,
            branchId: inventory.branchId,
            stockQuantity: String(inventory.stockQuantity ?? ""),
            reorderThreshold: String(inventory.reorderThreshold ?? ""),
            visibilityStatus: inventory.visibilityStatus ?? "visible",
          }
        : {
            ...emptyInventoryForm,
            productId,
          },
    );
    setModal("inventory");
  };

  const openPrescriptionReviewModal = (prescription) => {
    setPrescriptionReviewForm({
      prescriptionId: prescription._id,
      reviewStatus: prescription.reviewStatus ?? "approved",
      pharmacistNotes: prescription.pharmacistNotes ?? "",
    });
    setModal("prescriptionReview");
  };

  const openOrderUpdateModal = (order) => {
    setOrderUpdateForm({
      orderId: order._id,
      status: order.status ?? "APPROVED",
      notes: order.notes ?? "",
    });
    setModal("orderUpdate");
  };

  const openConsultationModal = async (consultation) => {
    setError("");

    try {
      const data = await apiFetch(`/consultations/admin/${consultation._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setActiveConsultation(data.consultation);
      setConsultationStatusForm({
        consultationId: data.consultation._id,
        status: data.consultation.status ?? "in_review",
        pharmacistNotes: data.consultation.pharmacistNotes ?? "",
      });
      setConsultationReplyForm({
        consultationId: data.consultation._id,
        body: "",
        status: "waiting_for_customer",
        pharmacistNotes: data.consultation.pharmacistNotes ?? "",
      });
      setModal("consultation");
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  const openPaymentUpdateModal = (payment) => {
    setPaymentUpdateForm({
      paymentId: payment._id,
      status: payment.status ?? "paid",
      notes: payment.notes ?? "",
    });
    setModal("paymentUpdate");
  };

  const openDeliveryCreateModal = () => {
    setDeliveryCreateForm(emptyDeliveryCreateForm);
    setModal("deliveryCreate");
  };

  const openDeliveryManageModal = (delivery) => {
    setDeliveryManageForm({
      deliveryId: delivery._id,
      riderId: delivery.riderId?._id ?? "",
      status: delivery.status ?? "ASSIGNED",
      notes: delivery.notes ?? "",
      deliveryOtp: delivery.deliveryOtp ?? "",
      codAmountCollected: String(delivery.codAmountCollected ?? ""),
    });
    setModal("deliveryManage");
  };

  const handleUserFormChange = (field, value) => {
    setUserForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "pharmacyId" ? { branchId: "" } : {}),
    }));
  };

  const handleSaveUser = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      if (editingUserId) {
        await apiFetch(`/auth/admin/users/${editingUserId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(userForm),
        });
        setMessage("User updated successfully.");
      } else {
        await apiFetch("/auth/admin/users", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(userForm),
        });
        setMessage("User created successfully.");
      }

      setEditingUserId(null);
      setUserForm(emptyUserForm);
      closeModal();
      await loadUsers(token, search);
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user account?")) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await apiFetch(`/auth/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("User deleted successfully.");
      await loadUsers(token, search);
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const handleApproveRider = async (userId) => {
    setError("");
    setMessage("");

    try {
      await apiFetch(`/auth/riders/${userId}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Rider approved successfully.");
      await loadUsers(token, search);
    } catch (approveError) {
      setError(approveError.message);
    }
  };

  const handleSavePharmacy = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      if (editingPharmacyId) {
        await apiFetch(`/pharmacies/${editingPharmacyId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(pharmacyForm),
        });
        setMessage("Pharmacy updated successfully.");
      } else {
        await apiFetch("/pharmacies", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(pharmacyForm),
        });
        setMessage("Pharmacy created successfully.");
      }

      setEditingPharmacyId(null);
      setPharmacyForm(emptyPharmacyForm);
      closeModal();
      await loadPharmacies(token);
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const handleDeletePharmacy = async (pharmacyId) => {
    if (!window.confirm("Delete this pharmacy?")) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await apiFetch(`/pharmacies/${pharmacyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Pharmacy deleted successfully.");
      await loadPharmacies(token);
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const handleSaveBranch = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      if (editingBranch) {
        await apiFetch(`/pharmacies/${editingBranch.pharmacyId}/branches/${editingBranch.branchId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(branchForm),
        });
        setMessage("Branch updated successfully.");
      } else {
        await apiFetch(`/pharmacies/${branchForm.pharmacyId}/branches`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(branchForm),
        });
        setMessage("Branch created successfully.");
      }

      setEditingBranch(null);
      setBranchForm(emptyBranchForm);
      closeModal();
      await loadPharmacies(token);
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const handleDeleteBranch = async (pharmacyId, branchId) => {
    if (!window.confirm("Delete this branch?")) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await apiFetch(`/pharmacies/${pharmacyId}/branches/${branchId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Branch deleted successfully.");
      await loadPharmacies(token);
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const handleSaveProduct = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const payload = {
        ...productForm,
        price: Number(productForm.price),
      };

      if (editingProductId) {
        await apiFetch(`/products/admin/${editingProductId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        setMessage("Product updated successfully.");
      } else {
        await apiFetch("/products/admin", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        setMessage("Product created successfully.");
      }

      setEditingProductId(null);
      setProductForm(emptyProductForm);
      closeModal();
      await loadProducts(token);
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const handleSaveInventory = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await apiFetch(`/products/admin/${inventoryForm.productId}/inventory`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          branchId: inventoryForm.branchId,
          stockQuantity: Number(inventoryForm.stockQuantity),
          reorderThreshold: Number(inventoryForm.reorderThreshold || 0),
          visibilityStatus: inventoryForm.visibilityStatus,
        }),
      });
      setMessage("Inventory updated successfully.");
      setInventoryForm(emptyInventoryForm);
      closeModal();
      await loadProducts(token);
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const handleSavePrescriptionReview = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await apiFetch(`/prescriptions/admin/${prescriptionReviewForm.prescriptionId}/review`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          reviewStatus: prescriptionReviewForm.reviewStatus,
          pharmacistNotes: prescriptionReviewForm.pharmacistNotes,
        }),
      });
      setMessage("Prescription reviewed successfully.");
      setPrescriptionReviewForm(emptyPrescriptionReviewForm);
      closeModal();
      await loadPrescriptions(token, prescriptionFilter);
    } catch (reviewError) {
      setError(reviewError.message);
    }
  };

  const handleSaveOrderUpdate = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await apiFetch(`/orders/admin/${orderUpdateForm.orderId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status: orderUpdateForm.status,
          notes: orderUpdateForm.notes,
        }),
      });
      setMessage("Order updated successfully.");
      setOrderUpdateForm(emptyOrderUpdateForm);
      closeModal();
      await loadOrders(token);
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const handleSaveConsultationStatus = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await apiFetch(`/consultations/admin/${consultationStatusForm.consultationId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status: consultationStatusForm.status,
          pharmacistNotes: consultationStatusForm.pharmacistNotes,
        }),
      });

      setMessage("Consultation updated successfully.");
      closeModal();
      setActiveConsultation(null);
      setConsultationStatusForm(emptyConsultationStatusForm);
      await loadConsultations(token);
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const handleSendConsultationReply = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await apiFetch(`/consultations/admin/${consultationReplyForm.consultationId}/reply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          body: consultationReplyForm.body,
          status: consultationReplyForm.status,
          pharmacistNotes: consultationReplyForm.pharmacistNotes,
        }),
      });

      setMessage("WhatsApp reply sent successfully.");
      closeModal();
      setActiveConsultation(null);
      setConsultationReplyForm(emptyConsultationReplyForm);
      await loadConsultations(token);
    } catch (replyError) {
      setError(replyError.message);
    }
  };

  const handleSavePaymentUpdate = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await apiFetch(`/payments/admin/${paymentUpdateForm.paymentId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status: paymentUpdateForm.status,
          notes: paymentUpdateForm.notes,
        }),
      });
      setMessage("Payment updated successfully.");
      setPaymentUpdateForm(emptyPaymentUpdateForm);
      closeModal();
      await Promise.all([loadPayments(token), loadOrders(token)]);
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const handleCreateDelivery = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await apiFetch("/deliveries/admin", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: deliveryCreateForm.orderId }),
      });
      setMessage("Delivery created successfully.");
      setDeliveryCreateForm(emptyDeliveryCreateForm);
      closeModal();
      await Promise.all([loadDeliveries(token), loadOrders(token)]);
    } catch (createError) {
      setError(createError.message);
    }
  };

  const handleSaveDelivery = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const currentDelivery = deliveries.find((delivery) => delivery._id === deliveryManageForm.deliveryId);
      const isNewAssignment = Boolean(deliveryManageForm.riderId) && !currentDelivery?.riderId?._id;
      const nextStatus =
        isNewAssignment && deliveryManageForm.status === "PENDING_ASSIGNMENT"
          ? "ASSIGNED"
          : deliveryManageForm.status;

      if (deliveryManageForm.riderId) {
        await apiFetch(`/deliveries/admin/${deliveryManageForm.deliveryId}/assign`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ riderId: deliveryManageForm.riderId }),
        });
      }

      await apiFetch(`/deliveries/admin/${deliveryManageForm.deliveryId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status: nextStatus,
          notes: deliveryManageForm.notes,
        }),
      });

      setMessage("Delivery updated successfully.");
      setDeliveryManageForm(emptyDeliveryManageForm);
      closeModal();
      await Promise.all([loadDeliveries(token), loadOrders(token)]);
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const sectionPrimaryAction = () => {
    if (section === "internal") {
      return (
        <button type="button" className="primary-button" onClick={() => openUserModal(null, "pharmacy_staff")}>
          + Add Internal User
        </button>
      );
    }

    if (section === "pharmacies") {
      return (
        <div className="header-actions">
          <button type="button" className="primary-button" onClick={() => openPharmacyModal()}>
            + Add Pharmacy
          </button>
          <button type="button" className="secondary-button" onClick={() => openBranchModal()}>
            + Add Branch
          </button>
        </div>
      );
    }

    if (section === "products") {
      return (
        <div className="header-actions">
          <button type="button" className="primary-button" onClick={() => openProductModal()}>
            + Add Product
          </button>
          <button type="button" className="secondary-button" onClick={() => openInventoryModal()}>
            + Add Inventory
          </button>
        </div>
      );
    }

    if (section === "deliveries") {
      return (
        <button type="button" className="primary-button" onClick={openDeliveryCreateModal}>
          + Create Delivery
        </button>
      );
    }

    return null;
  };

  if (!session) {
    return (
      <div className="login-shell">
        <form className="login-card" onSubmit={handleLogin}>
          <h1>NeedMed Admin</h1>
          <p>Sign in as an admin, pharmacist, or staff user.</p>
          <input
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="Email"
          />
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="Password"
          />
          <button type="submit">Sign in</button>
          {error ? <p className="error">{error}</p> : null}
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-shell">
        <aside className="sidebar">
          <div className="brand-block">
            <span className="brand-logo">Rx</span>
            <div>
              <h1>NeedMed Admin</h1>
              <p>{session.user.email}</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="nav-group">
                <p className="nav-group-label">{group.label}</p>
                {group.items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={section === item ? "nav-item active" : "nav-item"}
                    onClick={() => setSection(item)}
                  >
                    <span className="nav-icon">{NAV_ICONS[item]}</span>
                    {groupLabel[item]}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="sidebar-actions-group">
            <p className="nav-group-label">Quick Actions</p>
            <button type="button" className="sidebar-action" onClick={() => openUserModal(null, "pharmacy_staff")}>
              + Add Internal User
            </button>
            <button type="button" className="sidebar-action" onClick={() => openPharmacyModal()}>
              + Add Pharmacy
            </button>
            <button type="button" className="sidebar-action" onClick={() => openProductModal()}>
              + Add Product
            </button>
            <button type="button" className="sidebar-action" onClick={openDeliveryCreateModal}>
              + Create Delivery
            </button>
          </div>
        </aside>

        <main className="content">
          <header className="page-header">
            <div>
              <h2>{groupLabel[section]}</h2>
              <p>Each module now uses tables, popup forms, and color-coded workflow statuses.</p>
            </div>
            <div className="page-header-actions">
              {sectionPrimaryAction()}
              <input
                className="search-input"
                placeholder="Search users"
                value={search}
                onChange={handleSearch}
              />
            </div>
          </header>

          {message ? <p className="success banner">{message}</p> : null}
          {error ? <p className="error banner">{error}</p> : null}

          {section === "overview" ? (
            <section className="stats-grid">
              <article className="card stat-card">
                <h3>Total customers</h3>
                <strong>{usersBySection.customers.length}</strong>
              </article>
              <article className="card stat-card">
                <h3>Total internal users</h3>
                <strong>{usersBySection.internal.length}</strong>
              </article>
              <article className="card stat-card">
                <h3>Total riders</h3>
                <strong>{usersBySection.riders.length}</strong>
              </article>
              <article className="card stat-card">
                <h3>Active orders</h3>
                <strong>{orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status)).length}</strong>
              </article>
            </section>
          ) : null}

          {USER_SECTIONS.includes(section) ? (
            <TableCard
              title={groupLabel[section]}
              action={
                section === "internal" ? (
                  <button type="button" className="primary-button" onClick={() => openUserModal(null, "pharmacy_staff")}>
                    + Add Internal User
                  </button>
                ) : null
              }
            >
              {usersBySection[section].length === 0 ? (
                <EmptyState text="No users found in this section." />
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Assignment</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersBySection[section].map((user) => (
                        <tr key={user.id}>
                          <td>
                            <strong>
                              {user.firstName} {user.lastName}
                            </strong>
                          </td>
                          <td>{user.email}</td>
                          <td>{user.phone || "Not set"}</td>
                          <td>
                            <StatusBadge value={user.role} />
                          </td>
                          <td>
                            <StatusBadge value={user.accountStatus} />
                          </td>
                          <td>
                            {user.pharmacyId || user.branchId ? (
                              <div className="table-meta">
                                <span>{pharmacies.find((item) => item._id === user.pharmacyId)?.name || "Assigned pharmacy"}</span>
                                <span>{branchMap.get(user.branchId)?.name || "Assigned branch"}</span>
                              </div>
                            ) : (
                              "Unassigned"
                            )}
                          </td>
                          <td>
                            <div className="row-actions">
                              {user.role === "rider" && user.accountStatus === "pending_approval" ? (
                                <button type="button" className="action-button info" onClick={() => handleApproveRider(user.id)}>
                                  Approve
                                </button>
                              ) : null}
                              <button type="button" className="action-button" onClick={() => openUserModal(user)}>
                                Edit
                              </button>
                              <button type="button" className="action-button danger" onClick={() => handleDeleteUser(user.id)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TableCard>
          ) : null}

          {section === "pharmacies" ? (
            <div className="stack-grid">
              <TableCard
                title="Pharmacies"
                action={
                  <button type="button" className="primary-button" onClick={() => openPharmacyModal()}>
                    + Add Pharmacy
                  </button>
                }
              >
                {pharmacies.length === 0 ? (
                  <EmptyState text="No pharmacies configured yet." />
                ) : (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Slug</th>
                          <th>Support</th>
                          <th>Status</th>
                          <th>Branches</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pharmacies.map((pharmacy) => (
                          <tr key={pharmacy._id}>
                            <td>
                              <strong>{pharmacy.name}</strong>
                            </td>
                            <td>{pharmacy.slug}</td>
                            <td>
                              <div className="table-meta">
                                <span>{pharmacy.supportEmail || "No email"}</span>
                                <span>{pharmacy.supportPhone || "No phone"}</span>
                              </div>
                            </td>
                            <td>
                              <StatusBadge value={pharmacy.isActive ? "active" : "inactive"} />
                            </td>
                            <td>{pharmacy.branches.length}</td>
                            <td>
                              <div className="row-actions">
                                <button type="button" className="action-button info" onClick={() => openBranchModal(null, pharmacy._id)}>
                                  Add Branch
                                </button>
                                <button type="button" className="action-button" onClick={() => openPharmacyModal(pharmacy)}>
                                  Edit
                                </button>
                                <button type="button" className="action-button danger" onClick={() => handleDeletePharmacy(pharmacy._id)}>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TableCard>

              <TableCard
                title="Branches"
                action={
                  <button type="button" className="secondary-button" onClick={() => openBranchModal()}>
                    + Add Branch
                  </button>
                }
              >
                {flattenedBranches.length === 0 ? (
                  <EmptyState text="No branches configured yet." />
                ) : (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Pharmacy</th>
                          <th>Branch</th>
                          <th>Code</th>
                          <th>Location</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {flattenedBranches.map((branch) => (
                          <tr key={branch._id}>
                            <td>{branch.pharmacyName}</td>
                            <td>
                              <strong>{branch.name}</strong>
                            </td>
                            <td>{branch.code}</td>
                            <td>
                              {branch.addressLine1}, {branch.city}
                            </td>
                            <td>
                              <StatusBadge value={branch.isActive ? "active" : "inactive"} />
                            </td>
                            <td>
                              <div className="row-actions">
                                <button type="button" className="action-button" onClick={() => openBranchModal(branch)}>
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="action-button danger"
                                  onClick={() => handleDeleteBranch(branch.pharmacyId, branch._id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TableCard>
            </div>
          ) : null}

          {section === "products" ? (
            <div className="stack-grid">
              <TableCard
                title="Products"
                action={
                  <button type="button" className="primary-button" onClick={() => openProductModal()}>
                    + Add Product
                  </button>
                }
              >
                {products.length === 0 ? (
                  <EmptyState text="No products available yet." />
                ) : (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Category</th>
                          <th>SKU</th>
                          <th>Price</th>
                          <th>Prescription</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product._id}>
                            <td>
                              <div className="table-meta">
                                <strong>{product.name}</strong>
                                <span>{product.brand || product.genericName || "No brand info"}</span>
                              </div>
                            </td>
                            <td>{product.category || "Uncategorized"}</td>
                            <td>{product.sku || "No SKU"}</td>
                            <td>{formatCurrency(product.price)}</td>
                            <td>
                              <StatusBadge value={product.prescriptionOnly ? "required" : "open"} />
                            </td>
                            <td>
                              <StatusBadge value={product.isActive ? "active" : "inactive"} />
                            </td>
                            <td>
                              <div className="row-actions">
                                <button type="button" className="action-button info" onClick={() => openInventoryModal(null, product._id)}>
                                  Add Inventory
                                </button>
                                <button type="button" className="action-button" onClick={() => openProductModal(product)}>
                                  Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TableCard>

              <TableCard
                title="Branch Inventory"
                action={
                  <button type="button" className="secondary-button" onClick={() => openInventoryModal()}>
                    + Add Inventory
                  </button>
                }
              >
                {flattenedInventory.length === 0 ? (
                  <EmptyState text="No branch inventory records available yet." />
                ) : (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Branch</th>
                          <th>Stock</th>
                          <th>Threshold</th>
                          <th>Stock Status</th>
                          <th>Visibility</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {flattenedInventory.map((inventory) => (
                          <tr key={inventory._id}>
                            <td>{inventory.productName}</td>
                            <td>{inventory.branchName}</td>
                            <td>{inventory.stockQuantity}</td>
                            <td>{inventory.reorderThreshold}</td>
                            <td>
                              <StatusBadge value={inventory.stockStatus} />
                            </td>
                            <td>
                              <StatusBadge value={inventory.visibilityStatus} />
                            </td>
                            <td>
                              <div className="row-actions">
                                <button type="button" className="action-button" onClick={() => openInventoryModal(inventory)}>
                                  Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TableCard>
            </div>
          ) : null}

          {section === "prescriptions" ? (
            <TableCard
              title="Prescriptions"
              action={
                <select
                  className="table-filter"
                  value={prescriptionFilter}
                  onChange={async (event) => {
                    const value = event.target.value;
                    setPrescriptionFilter(value);
                    await loadPrescriptions(token, value);
                  }}
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="requires_follow_up">Requires follow-up</option>
                </select>
              }
            >
              {prescriptions.length === 0 ? (
                <EmptyState text="No prescriptions available for review." />
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Requested Product</th>
                        <th>Status</th>
                        <th>File</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptions.map((prescription) => (
                        <tr key={prescription._id}>
                          <td>
                            <strong>{prescription.customerName}</strong>
                          </td>
                          <td>{prescription.customerPhone}</td>
                          <td>{prescription.productName || "No product specified"}</td>
                          <td>
                            <StatusBadge value={prescription.reviewStatus} />
                          </td>
                          <td>
                            <a href={`${API_BASE_URL}${prescription.fileUrl}`} target="_blank" rel="noreferrer">
                              View file
                            </a>
                          </td>
                          <td>
                            <div className="row-actions">
                              <button type="button" className="action-button" onClick={() => openPrescriptionReviewModal(prescription)}>
                                Review
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TableCard>
          ) : null}

          {section === "orders" ? (
            <TableCard title="Orders">
              {orders.length === 0 ? (
                <EmptyState text="No orders available." />
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Fulfillment</th>
                        <th>Payment</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id}>
                          <td>
                            <div className="table-meta">
                              <strong>{order.orderNumber}</strong>
                              <span>{order.items.length} item(s)</span>
                            </div>
                          </td>
                          <td>
                            <div className="table-meta">
                              <span>{order.customerName}</span>
                              <span>{order.customerPhone}</span>
                            </div>
                          </td>
                          <td>
                            <StatusBadge value={order.fulfillmentType} />
                          </td>
                          <td>
                            <div className="table-meta">
                              <StatusBadge value={order.paymentMethod} />
                              <StatusBadge value={order.paymentStatus} />
                            </div>
                          </td>
                          <td>{formatCurrency(order.totalAmount)}</td>
                          <td>
                            <StatusBadge value={order.status} />
                          </td>
                          <td>
                            <div className="row-actions">
                              <button type="button" className="action-button" onClick={() => openOrderUpdateModal(order)}>
                                Update
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TableCard>
          ) : null}

          {section === "consultations" ? (
            <TableCard title="WhatsApp Consultations">
              {consultations.length === 0 ? (
                <EmptyState text="No WhatsApp consultations received yet." />
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Channel</th>
                        <th>Request Summary</th>
                        <th>Workflow</th>
                        <th>Last Activity</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consultations.map((consultation) => (
                        <tr key={consultation._id}>
                          <td>
                            <div className="table-meta">
                              <strong>{consultation.customerName || "Unknown customer"}</strong>
                              <span>{consultation.customerPhone}</span>
                            </div>
                          </td>
                          <td>
                            <div className="table-meta">
                              <StatusBadge value={consultation.channel} />
                              <span>{consultation.customerWhatsapp}</span>
                            </div>
                          </td>
                          <td>
                            <div className="table-meta">
                              <span>{consultation.requestedSummary || "Still collecting intake details"}</span>
                              <span>{consultation.deliveryAddress || "No delivery address yet"}</span>
                            </div>
                          </td>
                          <td>
                            <div className="table-meta">
                              <StatusBadge value={consultation.status} />
                              <span>Step: {humanize(consultation.intakeStep)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="table-meta">
                              <span>{new Date(consultation.updatedAt).toLocaleString()}</span>
                              <span>{consultation.transcript?.length || 0} message(s)</span>
                            </div>
                          </td>
                          <td>
                            <div className="row-actions">
                              <button type="button" className="action-button" onClick={() => openConsultationModal(consultation)}>
                                Review
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TableCard>
          ) : null}

          {section === "payments" ? (
            <TableCard title="Payments">
              {payments.length === 0 ? (
                <EmptyState text="No payments available." />
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Method</th>
                        <th>Provider</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment._id}>
                          <td>
                            <strong>{payment.orderNumber}</strong>
                          </td>
                          <td>
                            <StatusBadge value={payment.paymentMethod} />
                          </td>
                          <td>{payment.provider}</td>
                          <td>{formatCurrency(payment.amount)}</td>
                          <td>
                            <StatusBadge value={payment.status} />
                          </td>
                          <td>
                            <div className="row-actions">
                              <button type="button" className="action-button" onClick={() => openPaymentUpdateModal(payment)}>
                                Update
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TableCard>
          ) : null}

          {section === "deliveries" ? (
            <TableCard
              title="Deliveries"
              action={
                <button type="button" className="primary-button" onClick={openDeliveryCreateModal}>
                  + Create Delivery
                </button>
              }
            >
              {deliveries.length === 0 ? (
                <EmptyState text="No deliveries created yet." />
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Address</th>
                        <th>Rider</th>
                        <th>Status</th>
                        <th>Tracking / Proof</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.map((delivery) => (
                        <tr key={delivery._id}>
                          <td>
                            <strong>{delivery.orderNumber}</strong>
                          </td>
                          <td>
                            <div className="table-meta">
                              <span>{delivery.customerName}</span>
                              <span>{delivery.customerPhone}</span>
                            </div>
                          </td>
                          <td>{delivery.deliveryAddress}</td>
                          <td>
                            {delivery.riderId ? (
                              <div className="table-meta">
                                <span>
                                  {[delivery.riderId.firstName, delivery.riderId.lastName].filter(Boolean).join(" ") || delivery.riderId.email}
                                </span>
                                <span>{delivery.riderId.email}</span>
                              </div>
                            ) : (
                              "Unassigned"
                            )}
                          </td>
                          <td>
                            <StatusBadge value={delivery.status} />
                          </td>
                          <td>
                            <div className="table-meta">
                              <span>
                                {delivery.riderId?.riderCurrentLocation?.latitude && delivery.riderId?.riderCurrentLocation?.longitude
                                  ? `${delivery.riderId.riderCurrentLocation.latitude.toFixed(5)}, ${delivery.riderId.riderCurrentLocation.longitude.toFixed(5)}`
                                  : "Location unavailable"}
                              </span>
                              <span>OTP: {delivery.deliveryOtp || "N/A"}</span>
                              <span>Proof: {delivery.proof?.method ? humanize(delivery.proof.method) : "Pending"}</span>
                              {delivery.proof?.photoUrl ? (
                                <a href={`${API_BASE_URL}${delivery.proof.photoUrl}`} target="_blank" rel="noreferrer">
                                  View photo
                                </a>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <div className="row-actions">
                              <button type="button" className="action-button" onClick={() => openDeliveryManageModal(delivery)}>
                                Manage
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TableCard>
          ) : null}
        </main>
      </div>

      <Modal open={modal === "user"} title={editingUserId ? "Edit User" : "Create Internal User"} onClose={closeModal}>
        <form className="modal-form" onSubmit={handleSaveUser}>
          <div className="form-grid">
            <input
              placeholder="First name"
              value={userForm.firstName}
              onChange={(event) => handleUserFormChange("firstName", event.target.value)}
            />
            <input
              placeholder="Last name"
              value={userForm.lastName}
              onChange={(event) => handleUserFormChange("lastName", event.target.value)}
            />
            <input
              placeholder="Email"
              value={userForm.email}
              onChange={(event) => handleUserFormChange("email", event.target.value)}
            />
            <input
              placeholder="Phone"
              value={userForm.phone}
              onChange={(event) => handleUserFormChange("phone", event.target.value)}
            />
            <input
              type="password"
              placeholder={editingUserId ? "New password (optional)" : "Temporary password"}
              value={userForm.password}
              onChange={(event) => handleUserFormChange("password", event.target.value)}
            />
            <select value={userForm.role} onChange={(event) => handleUserFormChange("role", event.target.value)}>
              <option value="pharmacy_staff">Pharmacy Staff</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="admin">Admin</option>
              {editingUserId ? <option value="customer">Customer</option> : null}
              {editingUserId ? <option value="rider">Rider</option> : null}
            </select>
            <select value={userForm.accountStatus} onChange={(event) => handleUserFormChange("accountStatus", event.target.value)}>
              <option value="active">Active</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="suspended">Suspended</option>
            </select>
            <select value={userForm.pharmacyId} onChange={(event) => handleUserFormChange("pharmacyId", event.target.value)}>
              <option value="">Unassigned pharmacy</option>
              {pharmacies.map((pharmacy) => (
                <option key={pharmacy._id} value={pharmacy._id}>
                  {pharmacy.name}
                </option>
              ))}
            </select>
            <select value={userForm.branchId} onChange={(event) => handleUserFormChange("branchId", event.target.value)}>
              <option value="">Unassigned branch</option>
              {userBranchOptions.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              {editingUserId ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === "pharmacy"} title={editingPharmacyId ? "Edit Pharmacy" : "Create Pharmacy"} onClose={closeModal}>
        <form className="modal-form" onSubmit={handleSavePharmacy}>
          <div className="form-grid">
            <input value={pharmacyForm.name} placeholder="Name" onChange={(event) => setPharmacyForm((current) => ({ ...current, name: event.target.value }))} />
            <input value={pharmacyForm.slug} placeholder="Slug" onChange={(event) => setPharmacyForm((current) => ({ ...current, slug: event.target.value }))} />
            <input value={pharmacyForm.supportEmail} placeholder="Support email" onChange={(event) => setPharmacyForm((current) => ({ ...current, supportEmail: event.target.value }))} />
            <input value={pharmacyForm.supportPhone} placeholder="Support phone" onChange={(event) => setPharmacyForm((current) => ({ ...current, supportPhone: event.target.value }))} />
            <select value={String(pharmacyForm.isActive)} onChange={(event) => setPharmacyForm((current) => ({ ...current, isActive: event.target.value === "true" }))}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              {editingPharmacyId ? "Save Pharmacy" : "Create Pharmacy"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === "branch"} title={editingBranch ? "Edit Branch" : "Create Branch"} onClose={closeModal}>
        <form className="modal-form" onSubmit={handleSaveBranch}>
          <div className="form-grid">
            <select value={branchForm.pharmacyId} onChange={(event) => setBranchForm((current) => ({ ...current, pharmacyId: event.target.value }))}>
              <option value="">Select pharmacy</option>
              {pharmacies.map((pharmacy) => (
                <option key={pharmacy._id} value={pharmacy._id}>
                  {pharmacy.name}
                </option>
              ))}
            </select>
            <input value={branchForm.name} placeholder="Branch name" onChange={(event) => setBranchForm((current) => ({ ...current, name: event.target.value }))} />
            <input value={branchForm.code} placeholder="Branch code" onChange={(event) => setBranchForm((current) => ({ ...current, code: event.target.value }))} />
            <input value={branchForm.addressLine1} placeholder="Address line" onChange={(event) => setBranchForm((current) => ({ ...current, addressLine1: event.target.value }))} />
            <input value={branchForm.city} placeholder="City" onChange={(event) => setBranchForm((current) => ({ ...current, city: event.target.value }))} />
            <input value={branchForm.country} placeholder="Country" onChange={(event) => setBranchForm((current) => ({ ...current, country: event.target.value }))} />
            <select value={String(branchForm.isActive)} onChange={(event) => setBranchForm((current) => ({ ...current, isActive: event.target.value === "true" }))}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              {editingBranch ? "Save Branch" : "Create Branch"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === "product"} title={editingProductId ? "Edit Product" : "Create Product"} onClose={closeModal} width="860px">
        <form className="modal-form" onSubmit={handleSaveProduct}>
          <div className="form-grid">
            <input value={productForm.name} placeholder="Name" onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} />
            <input value={productForm.genericName} placeholder="Generic name" onChange={(event) => setProductForm((current) => ({ ...current, genericName: event.target.value }))} />
            <input value={productForm.brand} placeholder="Brand" onChange={(event) => setProductForm((current) => ({ ...current, brand: event.target.value }))} />
            <input value={productForm.category} placeholder="Category" onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))} />
            <input value={productForm.unitType} placeholder="Unit type" onChange={(event) => setProductForm((current) => ({ ...current, unitType: event.target.value }))} />
            <input value={productForm.price} placeholder="Price" onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))} />
            <input value={productForm.sku} placeholder="SKU" onChange={(event) => setProductForm((current) => ({ ...current, sku: event.target.value }))} />
            <select value={String(productForm.isActive)} onChange={(event) => setProductForm((current) => ({ ...current, isActive: event.target.value === "true" }))}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <textarea value={productForm.description} placeholder="Description" onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} />
            <textarea value={productForm.warnings} placeholder="Warnings" onChange={(event) => setProductForm((current) => ({ ...current, warnings: event.target.value }))} />
          </div>
          <label className="checkbox-row">
            <input type="checkbox" checked={productForm.prescriptionOnly} onChange={(event) => setProductForm((current) => ({ ...current, prescriptionOnly: event.target.checked }))} />
            Prescription only product
          </label>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              {editingProductId ? "Save Product" : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === "inventory"} title="Manage Inventory" onClose={closeModal}>
        <form className="modal-form" onSubmit={handleSaveInventory}>
          <div className="form-grid">
            <select value={inventoryForm.productId} onChange={(event) => setInventoryForm((current) => ({ ...current, productId: event.target.value }))}>
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
            <select value={inventoryForm.branchId} onChange={(event) => setInventoryForm((current) => ({ ...current, branchId: event.target.value }))}>
              <option value="">Select branch</option>
              {flattenedBranches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.pharmacyName} / {branch.name}
                </option>
              ))}
            </select>
            <input value={inventoryForm.stockQuantity} placeholder="Stock quantity" onChange={(event) => setInventoryForm((current) => ({ ...current, stockQuantity: event.target.value }))} />
            <input value={inventoryForm.reorderThreshold} placeholder="Reorder threshold" onChange={(event) => setInventoryForm((current) => ({ ...current, reorderThreshold: event.target.value }))} />
            <select value={inventoryForm.visibilityStatus} onChange={(event) => setInventoryForm((current) => ({ ...current, visibilityStatus: event.target.value }))}>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Save Inventory
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === "prescriptionReview"} title="Review Prescription" onClose={closeModal}>
        <form className="modal-form" onSubmit={handleSavePrescriptionReview}>
          <div className="form-grid one-column">
            <select
              value={prescriptionReviewForm.reviewStatus}
              onChange={(event) => setPrescriptionReviewForm((current) => ({ ...current, reviewStatus: event.target.value }))}
            >
              <option value="approved">Approved</option>
              <option value="requires_follow_up">Requires Follow-up</option>
              <option value="rejected">Rejected</option>
            </select>
            <textarea
              value={prescriptionReviewForm.pharmacistNotes}
              placeholder="Pharmacist notes"
              onChange={(event) => setPrescriptionReviewForm((current) => ({ ...current, pharmacistNotes: event.target.value }))}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Save Review
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === "orderUpdate"} title="Update Order Status" onClose={closeModal}>
        <form className="modal-form" onSubmit={handleSaveOrderUpdate}>
          <div className="form-grid one-column">
            <select value={orderUpdateForm.status} onChange={(event) => setOrderUpdateForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="APPROVED">Approved</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY_FOR_DISPATCH">Ready For Dispatch</option>
              <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="FAILED_DELIVERY">Failed Delivery</option>
            </select>
            <textarea value={orderUpdateForm.notes} placeholder="Order notes" onChange={(event) => setOrderUpdateForm((current) => ({ ...current, notes: event.target.value }))} />
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Save Order
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === "consultation"} title="WhatsApp Consultation" onClose={closeModal} width="900px">
        {activeConsultation ? (
          <div className="consultation-layout">
            <section className="consultation-panel">
              <div className="consultation-summary-grid">
                <article className="summary-block">
                  <span className="summary-label">Customer</span>
                  <strong>{activeConsultation.customerName || "Unknown customer"}</strong>
                  <span>{activeConsultation.customerPhone}</span>
                  <span>{activeConsultation.customerWhatsapp}</span>
                </article>
                <article className="summary-block">
                  <span className="summary-label">Request</span>
                  <strong>{activeConsultation.requestedSummary || "Intake still in progress"}</strong>
                  <span>{activeConsultation.fulfillmentType ? humanize(activeConsultation.fulfillmentType) : "Unknown"}</span>
                  <span>{activeConsultation.paymentMethod ? humanize(activeConsultation.paymentMethod) : "Undecided"}</span>
                </article>
                <article className="summary-block">
                  <span className="summary-label">Workflow</span>
                  <StatusBadge value={activeConsultation.status} />
                  <span>Step: {humanize(activeConsultation.intakeStep)}</span>
                  <span>Prescription: {humanize(activeConsultation.prescriptionRequired)}</span>
                </article>
              </div>

              <div className="summary-note-card">
                <span className="summary-label">Delivery Address</span>
                <p>{activeConsultation.deliveryAddress || "No delivery address captured yet."}</p>
              </div>

              <div className="summary-note-card">
                <span className="summary-label">Additional Notes</span>
                <p>{activeConsultation.additionalNotes || "No additional notes."}</p>
              </div>

              <div className="transcript-panel">
                <div className="card-header-row">
                  <h3>Conversation Transcript</h3>
                </div>
                <div className="transcript-list">
                  {(activeConsultation.transcript || []).map((entry, index) => (
                    <article
                      key={`${entry.receivedAt || index}-${index}`}
                      className={entry.direction === "inbound" ? "transcript-bubble inbound" : "transcript-bubble outbound"}
                    >
                      <div className="transcript-meta">
                        <strong>{humanize(entry.senderType)}</strong>
                        <span>{new Date(entry.receivedAt).toLocaleString()}</span>
                      </div>
                      <p>{entry.body || "Media only message"}</p>
                      {entry.mediaUrls?.length ? (
                        <div className="transcript-links">
                          {entry.mediaUrls.map((url, indexValue) => (
                            <a key={`${url}-${indexValue}`} href={url} target="_blank" rel="noreferrer">
                              Media {indexValue + 1}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="consultation-side-forms">
              <form className="modal-form" onSubmit={handleSaveConsultationStatus}>
                <div className="card-header-row">
                  <h3>Update Status</h3>
                </div>
                <div className="form-grid one-column">
                  <select
                    value={consultationStatusForm.status}
                    onChange={(event) => setConsultationStatusForm((current) => ({ ...current, status: event.target.value }))}
                  >
                    <option value="intake_in_progress">Intake In Progress</option>
                    <option value="ready_for_review">Ready For Review</option>
                    <option value="in_review">In Review</option>
                    <option value="waiting_for_customer">Waiting For Customer</option>
                    <option value="completed">Completed</option>
                    <option value="closed">Closed</option>
                  </select>
                  <textarea
                    value={consultationStatusForm.pharmacistNotes}
                    placeholder="Internal pharmacist notes"
                    onChange={(event) =>
                      setConsultationStatusForm((current) => ({ ...current, pharmacistNotes: event.target.value }))
                    }
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="primary-button">
                    Save Status
                  </button>
                </div>
              </form>

              <form className="modal-form" onSubmit={handleSendConsultationReply}>
                <div className="card-header-row">
                  <h3>Reply on WhatsApp</h3>
                </div>
                <div className="form-grid one-column">
                  <textarea
                    value={consultationReplyForm.body}
                    placeholder="Type the pharmacist reply to send via WhatsApp"
                    onChange={(event) => setConsultationReplyForm((current) => ({ ...current, body: event.target.value }))}
                  />
                  <select
                    value={consultationReplyForm.status}
                    onChange={(event) => setConsultationReplyForm((current) => ({ ...current, status: event.target.value }))}
                  >
                    <option value="waiting_for_customer">Waiting For Customer</option>
                    <option value="in_review">In Review</option>
                    <option value="completed">Completed</option>
                    <option value="closed">Closed</option>
                  </select>
                  <textarea
                    value={consultationReplyForm.pharmacistNotes}
                    placeholder="Internal note to save with this reply"
                    onChange={(event) =>
                      setConsultationReplyForm((current) => ({ ...current, pharmacistNotes: event.target.value }))
                    }
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="primary-button">
                    Send WhatsApp Reply
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : null}
      </Modal>

      <Modal open={modal === "paymentUpdate"} title="Update Payment Status" onClose={closeModal}>
        <form className="modal-form" onSubmit={handleSavePaymentUpdate}>
          <div className="form-grid one-column">
            <select value={paymentUpdateForm.status} onChange={(event) => setPaymentUpdateForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="partially_refunded">Partially Refunded</option>
            </select>
            <textarea value={paymentUpdateForm.notes} placeholder="Payment notes" onChange={(event) => setPaymentUpdateForm((current) => ({ ...current, notes: event.target.value }))} />
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Save Payment
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === "deliveryCreate"} title="Create Delivery" onClose={closeModal}>
        <form className="modal-form" onSubmit={handleCreateDelivery}>
          <div className="form-grid one-column">
            <select value={deliveryCreateForm.orderId} onChange={(event) => setDeliveryCreateForm({ orderId: event.target.value })}>
              <option value="">Select delivery order</option>
              {deliveryEligibleOrders.map((order) => (
                <option key={order._id} value={order._id}>
                  {order.orderNumber} - {order.customerName}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Create Delivery
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === "deliveryManage"} title="Manage Delivery" onClose={closeModal}>
        <form className="modal-form" onSubmit={handleSaveDelivery}>
          <div className="form-grid one-column">
            <select
              value={deliveryManageForm.riderId}
              onChange={(event) =>
                setDeliveryManageForm((current) => ({
                  ...current,
                  riderId: event.target.value,
                  status: event.target.value && current.status === "PENDING_ASSIGNMENT" ? "ASSIGNED" : current.status,
                }))
              }
            >
              <option value="">Select rider</option>
              {activeRiders.map((rider) => (
                <option key={rider.id} value={rider.id}>
                  {rider.firstName} {rider.lastName} ({rider.email})
                </option>
              ))}
            </select>
            <select value={deliveryManageForm.status} onChange={(event) => setDeliveryManageForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="PENDING_ASSIGNMENT">Pending Assignment</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="ARRIVED_AT_PHARMACY">Arrived At Pharmacy</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <input value={deliveryManageForm.deliveryOtp} readOnly placeholder="Delivery OTP" />
            <input value={deliveryManageForm.codAmountCollected} readOnly placeholder="COD collected" />
            <textarea value={deliveryManageForm.notes} placeholder="Delivery notes" onChange={(event) => setDeliveryManageForm((current) => ({ ...current, notes: event.target.value }))} />
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Save Delivery
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
