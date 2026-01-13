"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "")) ||
  "";

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

export default function StartJobPage() {
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("");
  const [logs, setLogs] = useState([]);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");
  const [outputKey, setOutputKey] = useState("");
  const [streamActive, setStreamActive] = useState(false);
  const eventSourceRef = useRef(null);
  const pollTimerRef = useRef(null);

  const hasJob = Boolean(jobId);
  const isRunning = status === "running";

  const orderedLogs = useMemo(() => logs.slice(-400), [logs]);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!jobId) {
      return;
    }
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }
    pollTimerRef.current = setInterval(() => {
      fetchJobStatus(jobId);
    }, 5000);
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [jobId]);

  const appendLog = (line) => {
    if (!line) return;
    setLogs((prev) => [...prev.slice(-399), line]);
  };

  const fetchJobStatus = async (id) => {
    try {
      const res = await fetch(apiUrl(`/jobs/${id}`));
      if (!res.ok) return;
      const data = await res.json();
      if (data.status) setStatus(data.status);
      if (data.output_csv_s3_key) setOutputKey(data.output_csv_s3_key);
    } catch (err) {
      console.error("status poll error", err);
    }
  };

  const fetchLogsTail = async (id) => {
    try {
      const res = await fetch(apiUrl(`/jobs/${id}/logs?lines=200`));
      if (!res.ok) return;
      const text = await res.text();
      const lines = text.split("\n").filter(Boolean);
      setLogs(lines.slice(-400));
    } catch (err) {
      console.error("log poll error", err);
    }
  };

  const startStream = (id) => {
    if (typeof window === "undefined") return;
    if (!id) return;
    eventSourceRef.current?.close();

    const es = new EventSource(apiUrl(`/jobs/${id}/stream`));
    eventSourceRef.current = es;

    es.onopen = () => {
      setStreamActive(true);
      appendLog("[stream] open");
    };

    es.onerror = () => {
      appendLog("[stream] error, falling back to polling");
      setStreamActive(false);
      es.close();
      fetchLogsTail(id);
    };

    es.onmessage = (event) => {
      const text = event.data || "";
      if (text === "ready") {
        appendLog("[stream] ready");
        return;
      }
      if (text.startsWith("done")) {
        appendLog("[stream] done");
        setStreamActive(false);
        es.close();
        fetchJobStatus(id);
        return;
      }
      appendLog(text);
    };
  };

  const handleStart = async () => {
    setIsStarting(true);
    setError("");
    setLogs([]);
    setStatus("");
    setOutputKey("");
    try {
      const res = await fetch(apiUrl("/jobs/kuoni-batch"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to start job");
      }
      const data = await res.json();
      setJobId(data.job_id);
      setStatus(data.status || "running");
      startStream(data.job_id);
    } catch (err) {
      setError(err.message || "Failed to start job");
    } finally {
      setIsStarting(false);
    }
  };

  const handleCancel = async () => {
    if (!jobId) return;
    try {
      await fetch(apiUrl(`/jobs/${jobId}/cancel`), { method: "POST" });
      setStatus("canceled");
      appendLog("[client] cancel requested");
    } catch (err) {
      setError("Failed to cancel job");
    }
  };

  const handleRefresh = () => {
    if (jobId) {
      fetchJobStatus(jobId);
      fetchLogsTail(jobId);
    }
  };

  return (
    <main className="app-shell job-shell">
      <nav className="page-nav" aria-label="Primary">
        <Link href="/" className="btn ghost">
          Back to home
        </Link>
      </nav>
      <section className="hero">
        <div>
          <p className="pill">Roomberg Jobs</p>
          <h1 className="hero-title">Kuoni Batch Runner</h1>
          <p className="hero-subtitle">
            Start a batch, watch live logs via SSE, and fetch results.
          </p>
        </div>
        <div className="job-actions">
          <button
            className="btn"
            onClick={handleStart}
            disabled={isStarting || isRunning}
          >
            {isStarting ? "Starting..." : "Start job"}
          </button>
          <button
            className="btn secondary"
            onClick={handleCancel}
            disabled={!isRunning}
          >
            Cancel
          </button>
          <button className="btn ghost" onClick={handleRefresh} disabled={!hasJob}>
            Refresh
          </button>
        </div>
      </section>

      {error ? <p className="error-text">{error}</p> : null}

      <section className="job-grid">
        <div className="job-card">
          <p className="stat-label">Job ID</p>
          <p className="stat-value">{jobId || "—"}</p>
        </div>
        <div className="job-card">
          <p className="stat-label">Status</p>
          <p className="stat-value status-value">{status || "—"}</p>
          {streamActive ? <p className="stat-meta">SSE connected</p> : null}
        </div>
        <div className="job-card">
          <p className="stat-label">Output CSV key</p>
          <p className="stat-value small">{outputKey || "—"}</p>
          <p className="stat-meta">Fetch CSV when available</p>
        </div>
      </section>

      <section className="logs-panel">
        <div className="logs-header">
          <p className="stat-label">Logs (latest 400 lines)</p>
          <div className="log-meta">
            <span className="pill">{streamActive ? "SSE" : "Polling"}</span>
          </div>
        </div>
        <pre className="log-box">
{orderedLogs.length ? orderedLogs.join("\n") : "No logs yet. Start a job to stream output."}
        </pre>
      </section>
    </main>
  );
}
