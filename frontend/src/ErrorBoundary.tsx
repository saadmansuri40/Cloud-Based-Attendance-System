import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-red-200 max-w-2xl w-full">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Something went wrong!</h1>
            <p className="text-gray-700 mb-6 text-lg">
              The application encountered an unexpected error.
            </p>
            <div className="bg-gray-100 p-4 rounded text-left overflow-auto text-sm text-red-800 mb-6 max-h-64 border border-gray-300">
              <p className="font-bold">{this.state.error && this.state.error.toString()}</p>
              <br />
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Clear Data and Reload App
            </button>
            <p className="mt-4 text-xs text-gray-500">
              Note: This will log you out and clear your local data cache.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
