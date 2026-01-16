"use client";

import { useEffect, useRef, useState } from "react";

function formatStatus(status) {
  if (status === "running") {
    return "Running";
  }
  if (status === "done") {
    return "Done";
  }
  if (status === "error") {
    return "Error";
  }
  if (status === "canceled") {
    return "Canceled";
  }
  return "Idle";
}

export default function AvailabilityHeatmapRunner() {
  const [status, setStatus] = useState("idle");
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const controllerRef = useRef(null);
  const bufferRef = useRef("");

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const appendChunk = (chunk) => {
    if (!chunk) {
      return;
    }
    bufferRef.current += chunk;
    const parts = bufferRef.current.split("\n");
    bufferRef.current = parts.pop() ?? "";
    if (!parts.length) {
      return;
    }
    setLogs((prev) => [...prev, ...parts].slice(-400));
  };

  const flushBuffer = () => {
    if (!bufferRef.current) {
      return;
    }
    setLogs((prev) => [...prev, bufferRef.current].slice(-400));
    bufferRef.current = "";
  };

  const handleRun = async () => {
    if (status === "running") {
      return;
    }
    setStatus("running");
    setError("");
    setLogs([]);
    bufferRef.current = "";

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await fetch("/api/availability-run", {
        method: "POST",
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text || "Failed to start availability run");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        appendChunk(decoder.decode(value, { stream: true }));
      }
      flushBuffer();
      setStatus("done");
    } catch (err) {
      if (err?.name === "AbortError") {
        appendChunk("\n[client] canceled\n");
        flushBuffer();
        setStatus("canceled");
        return;
      }
      setStatus("error");
      setError(err?.message || "Failed to run availability");
    } finally {
      controllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (status !== "running") {
      return;
    }
    controllerRef.current?.abort();
  };

  return (
    <section className="logs-panel">
      <div className="logs-header">
        <p className="stat-label">Availability runner</p>
        <div className="job-actions">
          <button className="btn" onClick={handleRun} disabled={status === "running"}>
            {status === "running" ? "Running..." : "Run availability"}
          </button>
          <button
            className="btn secondary"
            onClick={handleStop}
            disabled={status !== "running"}
          >
            Stop
          </button>
          <span className="pill">{formatStatus(status)}</span>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <pre className="log-box">
{logs.length ? logs.join("\n") : "No logs yet. Run availability to fetch new data."}
      </pre>
      <p className="stat-meta">Refresh the page after completion to load the latest CSV.</p>
    </section>
  );
}
