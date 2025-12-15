'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: undefined,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        `Error captured in ${this.props.componentName || 'component'}:`,
        error,
        info
      );
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  renderFallback() {
    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6 text-center">
        <h3 className="text-red-300 text-lg font-semibold mb-2">
          Something went wrong{this.props.componentName ? ` in ${this.props.componentName}` : ''}
        </h3>
        {this.state.error?.message && (
          <p className="text-red-200 text-sm mb-4">{this.state.error.message}</p>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={this.handleReset}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-transparent border border-red-500 text-red-300 font-semibold py-2 px-6 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            Reload page
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







