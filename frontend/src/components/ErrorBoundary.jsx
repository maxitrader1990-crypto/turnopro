import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
                        <p className="text-gray-700 mb-4">
                            We're sorry, but an unexpected error has occurred.
                        </p>
                        {this.state.error && (
                            <div className="bg-gray-100 p-3 rounded text-sm font-mono overflow-auto max-h-48 mb-4">
                                <p className="font-bold text-red-800">{this.state.error.toString()}</p>
                                {this.state.errorInfo && (
                                    <pre className="text-xs text-gray-600 mt-2">{this.state.errorInfo.componentStack}</pre>
                                )}
                            </div>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                        >
                            Reload Page
                        </button>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <a href="/" className="text-blue-600 hover:underline text-sm">Go back to Home</a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
