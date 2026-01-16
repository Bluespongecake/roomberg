import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

export const runtime = "nodejs";

function resolveRepoRoot() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "kuoni_room_availability.py"))) {
    return cwd;
  }
  const parent = path.resolve(cwd, "..");
  if (fs.existsSync(path.join(parent, "kuoni_room_availability.py"))) {
    return parent;
  }
  return cwd;
}

export async function POST() {
  const repoRoot = resolveRepoRoot();
  const scriptPath = path.join(repoRoot, "kuoni_room_availability.py");

  if (!fs.existsSync(scriptPath)) {
    return new Response("kuoni_room_availability.py not found.", { status: 404 });
  }

  const pythonBin =
    process.env.PYTHON_BIN || process.env.PYTHON || process.env.PYTHON_PATH || "python3";
  const child = spawn(pythonBin, ["-u", "kuoni_room_availability.py"], {
    cwd: repoRoot,
    env: process.env,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const cleanup = () => {
        child.stdout?.off("data", push);
        child.stderr?.off("data", push);
        child.off("error", handleError);
        child.off("close", handleClose);
      };

      const closeStream = () => {
        if (closed) {
          return;
        }
        closed = true;
        cleanup();
        try {
          controller.close();
        } catch (error) {
          // Ignore double-close errors.
        }
      };

      const push = (data) => {
        if (closed || data == null) {
          return;
        }
        try {
          controller.enqueue(encoder.encode(String(data)));
        } catch (error) {
          closed = true;
        }
      };

      const handleError = (error) => {
        const message =
          error?.code === "ENOENT"
            ? `Python not found. Set PYTHON_BIN or install python3.\n${error.message}`
            : error?.message || "Unknown error";
        push(`\n[error] ${message}\n`);
        closeStream();
      };

      const handleClose = (code, signal) => {
        const suffix = signal ? ` signal ${signal}` : "";
        push(`\n[done] exit code ${code ?? "?"}${suffix}\n`);
        closeStream();
      };

      child.stdout.on("data", push);
      child.stderr.on("data", push);
      child.on("error", handleError);
      child.on("close", handleClose);
    },
    cancel() {
      child.kill("SIGTERM");
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
