import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// An ErrorBoundary is a class component that catches JavaScript errors anywhere in its child component tree.
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  // Fix: Converted to a standard class method to ensure `this` context is correctly handled by React's lifecycle.
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service.
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  // Fix: Converted to a standard class method to ensure `this` context is correctly handled by React's lifecycle.
  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI.
      return (
        <div className="h-screen w-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-900">
          <div className="max-w-2xl w-full bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg border border-red-500/30">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Something went wrong.</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              An unexpected error occurred in the application. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                <summary className="font-semibold cursor-pointer text-slate-700 dark:text-slate-200">Error Details</summary>
                <pre className="mt-2 text-sm text-red-500 dark:text-red-400 whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                   <pre className="mt-2 text-xs text-slate-500 dark:text-slate-400 whitespace-pre-wrap break-words">
                     {this.state.errorInfo.componentStack}
                   </pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
