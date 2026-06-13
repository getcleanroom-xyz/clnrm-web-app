"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback || (
          <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-5">
            <div className="text-center max-w-md">
              <div className="text-lg font-bold text-error mb-2">
                Something went wrong
              </div>
              <p className="text-xs text-white-mid leading-[1.75] mb-4">
                {this.state.error.message ||
                  "An unexpected error occurred."}
              </p>
              <button
                onClick={() => {
                  this.setState({ error: null });
                  window.location.reload();
                }}
                className="clip-spell border border-green/40 text-green text-xs font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-all hover:bg-green-dim/20"
              >
                Reload
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
