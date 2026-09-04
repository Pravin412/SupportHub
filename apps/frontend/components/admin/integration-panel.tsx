"use client";

import { useEffect, useState } from "react";
import { KeyRound, Eye, EyeOff, Check, Copy } from "lucide-react";
import { Card, Input, Button } from "@support-hub/ui";
import { api } from "../../lib/api";
import { useIntegrationCredentials } from "../../lib/queries";
import { useUiStore } from "../../lib/store";
import { PanelHeader } from "../admin-panels";

export function IntegrationPanel({ projectId }: { projectId?: string }) {
  const integrationCredentials = useIntegrationCredentials(projectId);
  const [integrationSecret, setIntegrationSecret] = useState("");
  const [copiedIntegrationKey, setCopiedIntegrationKey] = useState(false);
  const [copiedIntegrationSecret, setCopiedIntegrationSecret] = useState(false);
  const [showIntegrationKey, setShowIntegrationKey] = useState(false);
  const [showIntegrationSecret, setShowIntegrationSecret] = useState(false);
  
  const showToast = useUiStore((state) => state.showToast);

  useEffect(() => {
    setIntegrationSecret(integrationCredentials.data?.integrationSecret ?? "");
  }, [integrationCredentials.data]);

  return (
    <Card className="overflow-hidden border-slate-200">
      <PanelHeader icon={<KeyRound size={18} />} title="Integration" />
      <div className="space-y-4 p-4">
        <label className="block">
          <span className="text-sm font-medium">Integration key</span>
          <div className="mt-1 flex gap-2">
            <Input type={showIntegrationKey ? "text" : "password"} readOnly value={integrationCredentials.data?.integrationKey ?? ""} placeholder="Loading..." />
            <Button
              type="button"
              title="Toggle visibility"
              className="h-10 px-3"
              disabled={!integrationCredentials.data?.integrationKey}
              onClick={() => setShowIntegrationKey(!showIntegrationKey)}
            >
              {showIntegrationKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
            <Button
              type="button"
              title="Copy integration key"
              className="h-10 px-3"
              disabled={!integrationCredentials.data?.integrationKey}
              onClick={() => {
                const key = integrationCredentials.data?.integrationKey;
                if (!key) return;
                navigator.clipboard.writeText(key);
                setCopiedIntegrationKey(true);
                setTimeout(() => setCopiedIntegrationKey(false), 2000);
              }}
            >
              {copiedIntegrationKey ? <Check size={16} /> : <Copy size={16} />}
            </Button>
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Integration secret</span>
          <div className="mt-1 flex gap-2">
            <Input type={showIntegrationSecret ? "text" : "password"} readOnly value={integrationSecret} placeholder="Loading..." />
            <Button
              type="button"
              title="Toggle visibility"
              className="h-10 px-3"
              disabled={!integrationSecret}
              onClick={() => setShowIntegrationSecret(!showIntegrationSecret)}
            >
              {showIntegrationSecret ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
            <Button
              type="button"
              title="Copy integration secret"
              className="h-10 px-3"
              disabled={!integrationSecret}
              onClick={() => {
                if (!integrationSecret) return;
                navigator.clipboard.writeText(integrationSecret);
                setCopiedIntegrationSecret(true);
                setTimeout(() => setCopiedIntegrationSecret(false), 2000);
              }}
            >
              {copiedIntegrationSecret ? <Check size={16} /> : <Copy size={16} />}
            </Button>
          </div>
        </label>

        <div className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">
          Use this value as SUPPORT_HUB_INTEGRATION_SECRET in your bot environment.
        </div>

        <Button
          type="button"
          className="gap-2 bg-brand text-white hover:bg-brand/90"
          disabled={!projectId}
          onClick={async () => {
            if (!projectId) return;
            try {
              const credentials = await api.rotateIntegrationSecret(projectId);
              setIntegrationSecret(credentials.integrationSecret);
              showToast("Integration secret rotated successfully.", "success");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "Failed to rotate integration secret", "error");
            }
          }}
        >
          <KeyRound size={16} /> Rotate Integration Secret
        </Button>
      </div>
    </Card>
  );
}
