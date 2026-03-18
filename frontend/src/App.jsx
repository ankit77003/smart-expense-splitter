import React from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { api } from "./api";

function Shell({ children }) {
  const { user, logout } = useAuth();
  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <Link to="/" style={{ textDecoration: "none" }}>
            <strong>Smart Expense Splitter</strong>
          </Link>
          <div className="muted" style={{ fontSize: 12 }}>
            Minimal UI • strong settlement logic
          </div>
        </div>
        {user ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="muted">{user.email}</span>
            <button className="btn" onClick={logout}>
              Logout
            </button>
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Protected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function LoginPage() {
  const nav = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = React.useState("login");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") await register(name, email, password);
      else await login(email, password);
      nav("/");
    } catch (err) {
      setError(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h3 style={{ margin: 0 }}>{mode === "login" ? "Login" : "Register"}</h3>
        <button className="btn" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          Switch to {mode === "login" ? "Register" : "Login"}
        </button>
      </div>

      <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
        {mode === "register" ? (
          <div style={{ marginBottom: 10 }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Name
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
          </div>
        ) : null}

        <div style={{ marginBottom: 10 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
            Email
          </div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div style={{ marginBottom: 10 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
            Password
          </div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Min 6 chars"
            required
          />
        </div>

        {error ? <div className="error" style={{ marginBottom: 10 }}>{error}</div> : null}

        <button className="btn primary" disabled={loading} type="submit">
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
        </button>
      </form>
    </div>
  );
}

function DashboardPage() {
  const [groups, setGroups] = React.useState([]);
  const [name, setName] = React.useState("");
  const [memberEmails, setMemberEmails] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const data = await api.listGroups();
      setGroups(data.groups || []);
    } catch (err) {
      setError(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const emails = memberEmails
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await api.createGroup({ name, memberEmails: emails });
      setName("");
      setMemberEmails("");
      await refresh();
    } catch (err) {
      setError(err.message || "Failed");
    }
  };

  return (
    <div className="row">
      <div className="card" style={{ flex: "1 1 520px" }}>
        <h3 style={{ marginTop: 0 }}>Your Groups</h3>
        {error ? <div className="error">{error}</div> : null}
        {loading ? (
          <div className="muted">Loading...</div>
        ) : groups.length === 0 ? (
          <div className="muted">No groups yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Members</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g._id}>
                  <td>{g.name}</td>
                  <td className="muted">{(g.members || []).length}</td>
                  <td>
                    <Link to={`/groups/${g._id}`}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ width: 360 }}>
        <h3 style={{ marginTop: 0 }}>Create Group</h3>
        <form onSubmit={create}>
          <div style={{ marginBottom: 10 }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Group name
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Goa Trip" />
          </div>
          <div style={{ marginBottom: 10 }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Member emails (comma separated)
            </div>
            <input
              value={memberEmails}
              onChange={(e) => setMemberEmails(e.target.value)}
              placeholder="a@x.com, b@y.com"
            />
          </div>
          <button className="btn primary" type="submit">
            Create
          </button>
          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Note: only already-registered emails can be added.
          </div>
        </form>
      </div>
    </div>
  );
}

function GroupPage() {
  const { groupId } = useParams();
  const [group, setGroup] = React.useState(null);
  const [expenses, setExpenses] = React.useState([]);
  const [settlement, setSettlement] = React.useState(null);
  const [error, setError] = React.useState("");
  const [memberEmails, setMemberEmails] = React.useState("");

  const refresh = React.useCallback(async () => {
    setError("");
    try {
      const g = await api.getGroup(groupId);
      const e = await api.listExpenses(groupId);
      const s = await api.settlement(groupId);
      setGroup(g.group);
      setExpenses(e.expenses || []);
      setSettlement(s);
    } catch (err) {
      setError(err.message || "Failed");
    }
  }, [groupId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const addMembers = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const emails = memberEmails
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (emails.length === 0) return;
      await api.addMembers(groupId, { memberEmails: emails });
      setMemberEmails("");
      await refresh();
    } catch (err) {
      setError(err.message || "Failed");
    }
  };

  if (!group) return <div className="muted">Loading...</div>;

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <h3 style={{ margin: 0 }}>{group.name}</h3>
          <div className="muted" style={{ fontSize: 12 }}>
            Group ID: {group._id}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link className="btn primary" to={`/groups/${groupId}/add-expense`} style={{ textDecoration: "none" }}>
            Add Expense
          </Link>
          <Link className="btn" to="/" style={{ textDecoration: "none" }}>
            Back
          </Link>
        </div>
      </div>

      {error ? <div className="error" style={{ marginTop: 10 }}>{error}</div> : null}

      <div className="row" style={{ marginTop: 12 }}>
        <div className="card" style={{ flex: "1 1 420px" }}>
          <h3 style={{ marginTop: 0 }}>Members</h3>
          <ul style={{ marginTop: 0 }}>
            {(group.members || []).map((m) => (
              <li key={m._id}>
                {m.name} <span className="muted">({m.email})</span>
              </li>
            ))}
          </ul>
          <form onSubmit={addMembers}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Add members by email (comma separated)
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={memberEmails} onChange={(e) => setMemberEmails(e.target.value)} placeholder="new@x.com" />
              <button className="btn" type="submit">
                Add
              </button>
            </div>
          </form>
        </div>

        <div className="card" style={{ flex: "1 1 520px" }}>
          <h3 style={{ marginTop: 0 }}>Final Settlement (Optimized)</h3>
          {!settlement ? (
            <div className="muted">Loading...</div>
          ) : settlement.transfers.length === 0 ? (
            <div className="muted">All settled up.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {settlement.transfers.map((t, idx) => (
                  <tr key={idx}>
                    <td>{t.fromName}</td>
                    <td>{t.toName}</td>
                    <td>₹{t.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {settlement ? (
            <div style={{ marginTop: 12 }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                Net balances (positive = receive, negative = pay)
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {settlement.balances.map((b) => (
                    <tr key={b.userId}>
                      <td>
                        {b.name} <span className="muted">({b.email})</span>
                      </td>
                      <td>{b.net >= 0 ? `₹${b.net.toFixed(2)}` : `-₹${Math.abs(b.net).toFixed(2)}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Expenses</h3>
        {expenses.length === 0 ? (
          <div className="muted">No expenses yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
                <th>Payer</th>
                <th>Participants</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e._id}>
                  <td>{e.description || <span className="muted">(no description)</span>}</td>
                  <td>₹{Number(e.amount).toFixed(2)}</td>
                  <td>{e.payer?.name || "—"}</td>
                  <td className="muted">
                    {(e.participants || [])
                      .map((p) => `${p.user?.name || "?"} (₹${Number(p.share).toFixed(2)})`)
                      .join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AddExpensePage() {
  const { groupId } = useParams();
  const nav = useNavigate();
  const [group, setGroup] = React.useState(null);
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("0");
  const [payerId, setPayerId] = React.useState("");
  const [participantIds, setParticipantIds] = React.useState([]);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const g = await api.getGroup(groupId);
        setGroup(g.group);
        const first = g.group.members?.[0]?._id || "";
        setPayerId(first);
        setParticipantIds(g.group.members?.map((m) => m._id) || []);
      } catch (err) {
        setError(err.message || "Failed");
      }
    })();
  }, [groupId]);

  const toggleParticipant = (id) => {
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const amt = Number(amount);
      if (!amt || amt <= 0) throw new Error("Amount must be > 0");
      if (participantIds.length === 0) throw new Error("Pick at least 1 participant");
      await api.addExpense(groupId, {
        description,
        amount: amt,
        payerId,
        participantIds,
        splitType: "EQUAL",
      });
      nav(`/groups/${groupId}`);
    } catch (err) {
      setError(err.message || "Failed");
    }
  };

  if (!group) return <div className="muted">Loading...</div>;

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h3 style={{ marginTop: 0 }}>Add Expense</h3>
        <Link className="btn" to={`/groups/${groupId}`} style={{ textDecoration: "none" }}>
          Back
        </Link>
      </div>
      {error ? <div className="error" style={{ marginBottom: 10 }}>{error}</div> : null}
      <form onSubmit={submit}>
        <div className="row">
          <div style={{ flex: "1 1 360px" }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Description
            </div>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Dinner" />
          </div>
          <div style={{ width: 200 }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Amount (₹)
            </div>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" min="0" />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
            Payer
          </div>
          <select value={payerId} onChange={(e) => setPayerId(e.target.value)}>
            {(group.members || []).map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} ({m.email})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
            Participants (equal split)
          </div>
          <div className="row">
            {(group.members || []).map((m) => (
              <label key={m._id} className="card" style={{ padding: 10, borderRadius: 10 }}>
                <input
                  type="checkbox"
                  checked={participantIds.includes(m._id)}
                  onChange={() => toggleParticipant(m._id)}
                />{" "}
                {m.name} <span className="muted">({m.email})</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          <button className="btn primary" type="submit">
            Add
          </button>
          <button className="btn" type="button" onClick={() => nav(`/groups/${groupId}`)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <Protected>
                <DashboardPage />
              </Protected>
            }
          />
          <Route
            path="/groups/:groupId"
            element={
              <Protected>
                <GroupPage />
              </Protected>
            }
          />
          <Route
            path="/groups/:groupId/add-expense"
            element={
              <Protected>
                <AddExpensePage />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </AuthProvider>
  );
}

