import { useState } from "react";
import { api } from "../api";
import type { AuthStatus } from "../types";

type Props = {
  initialError?: string;
  onAuthenticated: (status: AuthStatus) => void;
};

export function TokenSetup({ initialError, onAuthenticated }: Props) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | undefined>(initialError);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;
    setBusy(true);
    setError(undefined);
    try {
      const status = await api.setToken(token.trim());
      onAuthenticated(status);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="centered">
      <div className="card">
        <h2>Connect your Notion integration</h2>
        <p>
          Create an internal integration at{" "}
          <a href="https://www.notion.so/profile/integrations" target="_blank" rel="noreferrer">
            notion.so/profile/integrations
          </a>{" "}
          and copy the secret token. Then open the database you want to edit in
          Notion → <strong>...</strong> menu → <strong>Connections</strong> and add the
          integration.
        </p>
        <p>
          The token is stored locally in <code>.env</code> at the project root (gitignored).
          You can also set <code>NOTION_TOKEN</code> as an environment variable before
          starting the app to skip this screen.
        </p>
        <form onSubmit={submit}>
          <input
            type="password"
            placeholder="ntn_..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoFocus
          />
          <div className="row">
            <button className="primary" type="submit" disabled={busy || !token.trim()}>
              {busy ? "Verifying..." : "Connect"}
            </button>
          </div>
        </form>
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}
