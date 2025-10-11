import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("🛑 ProspectPro error boundary captured an exception", {
      error,
      info,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  renderFallback() {
    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="max-w-3xl mx-auto mt-16 rounded-lg border border-red-200 bg-red-50 p-8 text-red-800">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-sm text-red-700">
          The interface recovered from an unexpected error. No data was lost,
          but the last action may not have completed. Please refresh the page or
          try again.
        </p>
        {this.state.error && (
          <pre className="mt-4 max-h-48 overflow-auto rounded bg-white p-4 text-xs text-red-600">
            {this.state.error.message}
          </pre>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm ring-1 ring-red-200 hover:bg-red-100"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderFallback();
    }

    return this.props.children;
  }
}
