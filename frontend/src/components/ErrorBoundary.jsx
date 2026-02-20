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
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 border-t-4 border-red-500 text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Ups! Algo salió mal</h2>
                        <p className="text-gray-600 mb-6">
                            Ha ocurrido un error inesperado. Hemos registrado el problema y estamos trabajando para solucionarlo.
                        </p>

                        <div className="bg-red-50 p-4 rounded text-left text-xs font-mono overflow-auto max-h-60 mb-6 text-red-900 border border-red-200">
                            <strong>Error:</strong> {this.state.error?.toString()}
                            <br />
                            <strong>Stack:</strong> {this.state.errorInfo?.componentStack}
                        </div>

                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105 shadow-md"
                            >
                                Recargar Página
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="text-indigo-600 hover:text-indigo-800 font-medium py-3 px-4"
                            >
                                Ir al Inicio
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
