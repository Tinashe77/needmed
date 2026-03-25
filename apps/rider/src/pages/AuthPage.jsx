import React from "react";

export const AuthPage = ({ mode, form, result, message, error, onModeChange, onFormChange, onSubmit }) => (
  <section className="status-card auth-card">
    <p className="eyebrow">NeedMed Rider PWA</p>
    <h1>Rider account access</h1>
    <p className="support-copy">Installable delivery workspace for riders, optimized for quick actions in the field.</p>

    <div className="toggle-row">
      <button type="button" className={mode === "login" ? "active" : ""} onClick={() => onModeChange("login")}>
        Login
      </button>
      <button type="button" className={mode === "register" ? "active" : ""} onClick={() => onModeChange("register")}>
        Register
      </button>
    </div>

    <form className="stack" onSubmit={onSubmit}>
      {mode === "register" ? (
        <>
          <input
            placeholder="First name"
            value={form.firstName}
            onChange={(event) => onFormChange((current) => ({ ...current, firstName: event.target.value }))}
          />
          <input
            placeholder="Last name"
            value={form.lastName}
            onChange={(event) => onFormChange((current) => ({ ...current, lastName: event.target.value }))}
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(event) => onFormChange((current) => ({ ...current, phone: event.target.value }))}
          />
        </>
      ) : null}

      <input
        placeholder="Email"
        value={form.email}
        onChange={(event) => onFormChange((current) => ({ ...current, email: event.target.value }))}
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(event) => onFormChange((current) => ({ ...current, password: event.target.value }))}
      />

      <button type="submit">{mode === "register" ? "Register rider account" : "Sign in"}</button>
    </form>

    {message ? <p className="success">{message}</p> : null}
    {error ? <p className="error">{error}</p> : null}

    {result ? (
      <div className="status-box">
        <strong>
          {result.firstName} {result.lastName}
        </strong>
        <p>Status: {result.accountStatus}</p>
        <p>Role: {result.role}</p>
      </div>
    ) : null}
  </section>
);
