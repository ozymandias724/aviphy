import type { ChildProcessWithoutNullStreams } from "node:child_process";

/**
 * Logging verbosity contract.
 *
 * normal:
 *   Human-friendly operational logging.
 *
 * debug:
 *   Operational logging plus internal
 *   diagnostics and child process output.
 */
export type LogLevel = "normal" | "debug";

type Logger = {
  log: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;

  /**
   * Attach logging and stream management
   * to a child process.
   */
  attachProcess: (name: string, child: ChildProcessWithoutNullStreams) => void;
};

/**
 * Create runtime logging helpers.
 *
 * Centralizes log-level checks and child
 * process diagnostics.
 */
export function createLogger(logLevel: LogLevel): Logger {
  return {
    /**
     * Human-friendly operational logging.
     *
     * Visible in all modes.
     */
    log: (...args: unknown[]) => {
      console.log(...args);
    },

    /**
     * Maximum diagnostic detail.
     *
     * Visible only in debug mode.
     */
    debug: (...args: unknown[]) => {
      if (logLevel === "debug") {
        console.log(...args);
      }
    },

    /**
     * Attach diagnostics to a child process.
     *
     * Child process stdout/stderr must always
     * be consumed. If buffers fill, the child
     * process can stall indefinitely.
     */
    attachProcess: (name: string, child: ChildProcessWithoutNullStreams) => {
      if (logLevel === "debug") {
        child.stdout.on("data", (data) => {
          process.stdout.write(data);
        });

        child.stderr.on("data", (data) => {
          process.stderr.write(data);
        });
      } else {
        /**
         * Silently drain streams while
         * preventing buffer buildup.
         */
        child.stdout.on("data", () => {});
        child.stderr.on("data", () => {});
      }

      child.on("close", (code, signal) => {
        if (logLevel === "debug") {
          console.log(`${name} exited with code ${code} and signal ${signal}`);
        }
      });

      child.on("error", (error) => {
        console.error(`\n${name} process error:`);
        console.error(error);
      });
    },
  };
}
