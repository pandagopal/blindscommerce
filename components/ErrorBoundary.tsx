'use client';

import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { logError } from '@/lib/errorHandling';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for monitoring
    logError(error, {
      errorInfo,
      component: 'ErrorBoundary',
      timestamp: new Date().toISOString()
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error!} 
            resetError={this.resetError} 
          />
        );
      }

      // Default error UI
      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Something went wrong
            </h3>
            <p className="text-red-600 mb-4">
              This component encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={this.resetError}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Try Again
            </button>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-red-700 font-medium">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-red-100 p-3 rounded border overflow-auto text-red-800">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Simple error fallback components
export const SimpleErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ 
  error, 
  resetError 
}) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
    <h3 className="text-red-800 font-medium mb-2">Error Loading Component</h3>
    <p className="text-red-600 text-sm mb-3">
      {error.message || 'An unexpected error occurred'}
    </p>
    <button
      onClick={resetError}
      className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
    >
      Retry
    </button>
  </div>
);

export const ProductErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ 
  resetError 
}) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
    <div className="text-center">
      <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
      <h3 className="text-gray-600 font-medium mb-2">Unable to load product</h3>
      <p className="text-gray-500 text-sm mb-3">
        There was an error displaying this product information.
      </p>
      <button
        onClick={resetError}
        className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
      >
        Try Again
      </button>
    </div>
  </div>
);

export default ErrorBoundary;