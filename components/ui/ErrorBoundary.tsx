import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // FIX: In a class component, state must be initialized. Adding a constructor to set the initial state makes `this.state`, `this.props`, and `this.setState` available throughout the component, resolving the errors.
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error: error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo: errorInfo });
  }

  render() {
    if (this.state.hasError) {
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