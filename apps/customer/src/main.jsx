import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, Route, Routes, useParams } from "react-router-dom";

import "./styles.css";

const API_URL = "http://127.0.0.1:5001/api";
const CART_KEY = "needmed_cart";
const CHECKOUT_KEY = "needmed_checkout";

const authFetch = async (path, options = {}) => {
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

const readLocalJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const Shell = ({ title, cartCount, children }) => (
  <div className="shell">
    <header className="hero">
      <p className="eyebrow">NeedMed</p>
      <h1>{title}</h1>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/catalog">Catalog</Link>
        <Link to="/prescriptions">Prescription</Link>
        <Link to="/cart">Cart ({cartCount})</Link>
        <Link to="/checkout">Checkout</Link>
        <Link to="/auth">Account</Link>
      </nav>
      <div className="hero-actions">
        <Link className="primary-link" to="/auth">
          Create Account
        </Link>
        <Link className="secondary-link" to="/cart">
          View Cart
        </Link>
      </div>
    </header>
    <main>{children}</main>
  </div>
);

const AuthPage = ({ cartCount }) => {
  const [mode, setMode] = React.useState("register");
  const [form, setForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload =
        mode === "register"
          ? form
          : {
              email: form.email,
              password: form.password,
            };

      const data = await authFetch(mode === "register" ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      localStorage.setItem("needmed_customer_token", data.token);
      setResult(data.user);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell title="Customer account access" cartCount={cartCount}>
      <section className="panel form-panel">
        <div className="tab-row">
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button">
            Register
          </button>
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">
            Login
          </button>
        </div>
        <p className="helper-copy">
          Create your own NeedMed account here. Registration is available directly from the customer app.
        </p>
        <form className="stack" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <>
              <input name="firstName" placeholder="First name" value={form.firstName} onChange={handleChange} />
              <input name="lastName" placeholder="Last name" value={form.lastName} onChange={handleChange} />
              <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
            </>
          ) : null}
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}
          </button>
        </form>
        {error ? <p className="feedback error">{error}</p> : null}
        {result ? (
          <div className="result-card">
            <h3>Authenticated</h3>
            <p>
              {result.firstName} {result.lastName}
            </p>
            <p>{result.email}</p>
            <p>Role: {result.role}</p>
            <p>Account setup is complete and ready for protected customer flows.</p>
          </div>
        ) : null}
      </section>
    </Shell>
  );
};

const HomePage = ({ cartCount }) => (
  <Shell title="Fast access to medication and pharmacy support." cartCount={cartCount}>
    <section className="panel">
      <h2>Create an account or continue as guest</h2>
      <p>Browse the live catalog, build a cart, and prepare for guest or registered checkout.</p>
      <div className="cta-row">
        <Link className="primary-link" to="/catalog">
          Browse medicine
        </Link>
        <Link className="secondary-link" to="/checkout">
          Continue as guest
        </Link>
      </div>
    </section>
  </Shell>
);

const CatalogPage = ({ cartCount, onAddToCart }) => {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const run = async () => {
      try {
        const data = await authFetch("/products");
        setProducts(data.products);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <Shell title="Browse products" cartCount={cartCount}>
      <section className="panel">
        <p>Catalog results now come from the live API and can be added to the cart directly.</p>
        {loading ? <p>Loading products...</p> : null}
        {error ? <p className="feedback error">{error}</p> : null}
        <div className="catalog-grid">
          {products.map((product) => (
            <article key={product._id} className="catalog-card">
              <h2>{product.name}</h2>
              <p>{product.category}</p>
              <p>${Number(product.price).toFixed(2)}</p>
              <p>{product.prescriptionOnly ? "Prescription required" : "General sale"}</p>
              <div className="card-actions">
                <Link className="secondary-link" to={`/catalog/${product._id}`}>
                  View details
                </Link>
                <button type="button" className="mini-button" onClick={() => onAddToCart(product, 1)}>
                  Add to cart
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Shell>
  );
};

const ProductDetailPage = ({ cartCount, onAddToCart }) => {
  const { productId } = useParams();
  const [product, setProduct] = React.useState(null);
  const [quantity, setQuantity] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const run = async () => {
      try {
        const data = await authFetch(`/products/${productId}`);
        setProduct(data.product);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [productId]);

  return (
    <Shell title="Product details" cartCount={cartCount}>
      <section className="panel">
        {loading ? <p>Loading product...</p> : null}
        {error ? <p className="feedback error">{error}</p> : null}
        {product ? (
          <div className="detail-stack">
            <div>
              <h2>{product.name}</h2>
              <p>{product.description || "No product description yet."}</p>
              <p>Category: {product.category}</p>
              <p>Unit: {product.unitType}</p>
              <p>Price: ${Number(product.price).toFixed(2)}</p>
              <p>{product.prescriptionOnly ? "Prescription required" : "Available without prescription"}</p>
            </div>
            <div className="purchase-box">
              <label>
                Quantity
                <input
                  className="qty-input"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value) || 1)}
                />
              </label>
              <button type="button" onClick={() => onAddToCart(product, quantity)}>
                Add to cart
              </button>
              {product.prescriptionOnly ? (
                <Link className="secondary-link" to="/prescriptions">
                  Upload prescription
                </Link>
              ) : null}
              <Link className="secondary-link" to="/cart">
                Go to cart
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </Shell>
  );
};

const PrescriptionPage = ({ cartCount }) => {
  const [form, setForm] = React.useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    productName: "",
    notes: "",
  });
  const [fileState, setFileState] = React.useState({
    fileName: "",
    fileData: "",
    mimeType: "",
  });
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFileState({
        fileName: file.name,
        fileData: String(reader.result),
        mimeType: file.type || "application/octet-stream",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await authFetch("/prescriptions", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          ...fileState,
        }),
      });

      setMessage("Prescription uploaded successfully. A pharmacist will review it.");
      setForm({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        productName: "",
        notes: "",
      });
      setFileState({
        fileName: "",
        fileData: "",
        mimeType: "",
      });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell title="Prescription upload" cartCount={cartCount}>
      <section className="panel form-panel">
        <p>Upload a prescription for pharmacist review before restricted medication is approved.</p>
        <form className="stack" onSubmit={handleSubmit}>
          <input
            placeholder="Full name"
            value={form.customerName}
            onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
          />
          <input
            placeholder="Phone"
            value={form.customerPhone}
            onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))}
          />
          <input
            placeholder="Email"
            value={form.customerEmail}
            onChange={(event) => setForm((current) => ({ ...current, customerEmail: event.target.value }))}
          />
          <input
            placeholder="Medicine or product"
            value={form.productName}
            onChange={(event) => setForm((current) => ({ ...current, productName: event.target.value }))}
          />
          <input type="file" accept="image/*,.pdf" onChange={handleFile} />
          <textarea
            className="notes-input"
            placeholder="Notes"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Uploading..." : "Submit prescription"}
          </button>
        </form>
        {message ? <p className="feedback success-text">{message}</p> : null}
        {error ? <p className="feedback error">{error}</p> : null}
      </section>
    </Shell>
  );
};

const CartPage = ({ cart, cartCount, onUpdateQuantity, onRemoveItem }) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Shell title="Your cart" cartCount={cartCount}>
      <section className="panel">
        {cart.length === 0 ? <p>Your cart is empty. Add products from the catalog to continue.</p> : null}
        <div className="cart-list">
          {cart.map((item) => (
            <div key={item.productId} className="cart-row">
              <div>
                <h2>{item.name}</h2>
                <p>
                  ${Number(item.price).toFixed(2)} each • {item.prescriptionOnly ? "Prescription required" : "General sale"}
                </p>
              </div>
              <div className="cart-actions">
                <input
                  className="qty-input"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) => onUpdateQuantity(item.productId, Number(event.target.value) || 1)}
                />
                <button type="button" className="mini-button" onClick={() => onRemoveItem(item.productId)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 ? (
          <div className="cart-summary">
            <strong>Total: ${total.toFixed(2)}</strong>
            <Link className="primary-link" to="/checkout">
              Proceed to checkout
            </Link>
          </div>
        ) : null}
      </section>
    </Shell>
  );
};

const CheckoutPage = ({ cart, cartCount, checkoutDraft, onChangeDraft }) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [mockPayment, setMockPayment] = React.useState(null);

  const handleSubmitOrder = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("needmed_customer_token");
      let customerId = null;
      let customerEmail = checkoutDraft.email || "";

      if (token) {
        const me = await authFetch("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        customerId = me.user.id;
        customerEmail = me.user.email || customerEmail;
      }

      const data = await authFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          customerId,
          customerName: checkoutDraft.fullName,
          customerPhone: checkoutDraft.phone,
          customerEmail,
          fulfillmentType: checkoutDraft.fulfillmentType,
          paymentMethod: checkoutDraft.paymentMethod,
          deliveryAddress: checkoutDraft.address,
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      if (checkoutDraft.paymentMethod === "online") {
        const session = await authFetch("/payments/session", {
          method: "POST",
          body: JSON.stringify({
            orderId: data.order._id,
          }),
        });
        setMockPayment(session.payment);
        setMessage(`Order ${data.order.orderNumber} created. Complete mock payment to continue.`);
      } else {
        await authFetch("/payments/cod", {
          method: "POST",
          body: JSON.stringify({
            orderId: data.order._id,
          }),
        });
        setMessage(`Order ${data.order.orderNumber} created successfully.`);
        localStorage.setItem(CART_KEY, JSON.stringify([]));
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMockPayment = async (status) => {
    if (!mockPayment) return;

    setLoading(true);
    setError("");

    try {
      await authFetch("/payments/callback", {
        method: "POST",
        body: JSON.stringify({
          sessionReference: mockPayment.sessionReference,
          status,
        }),
      });

      if (status === "paid") {
        setMessage("Mock online payment completed successfully.");
        localStorage.setItem(CART_KEY, JSON.stringify([]));
      } else {
        setMessage("Mock online payment marked as failed.");
      }
    } catch (callbackError) {
      setError(callbackError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell title="Checkout" cartCount={cartCount}>
      <section className="panel form-panel">
        <p>Checkout now submits a real order into the order engine.</p>
        <form className="stack">
          <input
            placeholder="Full name"
            value={checkoutDraft.fullName}
            onChange={(event) => onChangeDraft("fullName", event.target.value)}
          />
          <input
            placeholder="Phone"
            value={checkoutDraft.phone}
            onChange={(event) => onChangeDraft("phone", event.target.value)}
          />
          <input
            placeholder="Email"
            value={checkoutDraft.email || ""}
            onChange={(event) => onChangeDraft("email", event.target.value)}
          />
          <input
            placeholder="Delivery address"
            value={checkoutDraft.address}
            onChange={(event) => onChangeDraft("address", event.target.value)}
          />
          <select value={checkoutDraft.fulfillmentType} onChange={(event) => onChangeDraft("fulfillmentType", event.target.value)}>
            <option value="delivery">Delivery</option>
            <option value="pickup">Pickup</option>
          </select>
          <select value={checkoutDraft.paymentMethod} onChange={(event) => onChangeDraft("paymentMethod", event.target.value)}>
            <option value="cash_on_delivery">Cash on delivery</option>
            <option value="online">Online payment</option>
          </select>
        </form>
        <div className="checkout-box">
          <h2>Order preview</h2>
          <p>{cart.length} item(s)</p>
          <p>Total: ${total.toFixed(2)}</p>
          <button type="button" className="mini-button" disabled={loading || cart.length === 0} onClick={handleSubmitOrder}>
            {loading ? "Submitting..." : "Place order"}
          </button>
          {mockPayment ? (
            <div className="card-actions">
              <button type="button" className="mini-button" disabled={loading} onClick={() => handleMockPayment("paid")}>
                Complete mock payment
              </button>
              <button type="button" className="secondary-link" disabled={loading} onClick={() => handleMockPayment("failed")}>
                Mark payment failed
              </button>
            </div>
          ) : null}
          {message ? <p className="success-text">{message}</p> : null}
          {error ? <p className="feedback error">{error}</p> : null}
        </div>
      </section>
    </Shell>
  );
};

const App = () => {
  const [cart, setCart] = React.useState(() => readLocalJson(CART_KEY, []));
  const [checkoutDraft, setCheckoutDraft] = React.useState(() =>
    readLocalJson(CHECKOUT_KEY, {
      fullName: "",
      phone: "",
      address: "",
      fulfillmentType: "delivery",
      paymentMethod: "cash_on_delivery",
    }),
  );

  React.useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  React.useEffect(() => {
    localStorage.setItem(CHECKOUT_KEY, JSON.stringify(checkoutDraft));
  }, [checkoutDraft]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (product, quantity) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === product._id);

      if (existing) {
        return current.map((item) =>
          item.productId === product._id ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }

      return [
        ...current,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          prescriptionOnly: product.prescriptionOnly,
          quantity,
        },
      ];
    });
  };

  const handleUpdateQuantity = (productId, quantity) => {
    setCart((current) =>
      current.map((item) => (item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item)),
    );
  };

  const handleRemoveItem = (productId) => {
    setCart((current) => current.filter((item) => item.productId !== productId));
  };

  const handleCheckoutDraft = (field, value) => {
    setCheckoutDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage cartCount={cartCount} />} />
        <Route path="/catalog" element={<CatalogPage cartCount={cartCount} onAddToCart={handleAddToCart} />} />
        <Route
          path="/catalog/:productId"
          element={<ProductDetailPage cartCount={cartCount} onAddToCart={handleAddToCart} />}
        />
        <Route
          path="/cart"
          element={
            <CartPage
              cart={cart}
              cartCount={cartCount}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />
          }
        />
        <Route
          path="/checkout"
          element={
            <CheckoutPage
              cart={cart}
              cartCount={cartCount}
              checkoutDraft={checkoutDraft}
              onChangeDraft={handleCheckoutDraft}
            />
          }
        />
        <Route path="/prescriptions" element={<PrescriptionPage cartCount={cartCount} />} />
        <Route path="/auth" element={<AuthPage cartCount={cartCount} />} />
      </Routes>
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
