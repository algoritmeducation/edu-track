import { useState, useCallback, useRef, createContext, useContext } from 'react';

const ToastCtx = createContext(null);

export function useToast() {
    return useContext(ToastCtx);
}

export function ToastProvider({ children }) {
    const [toast, setToast] = useState({ msg: '', err: false, show: false });
    const timer = useRef(null);

    const showToast = useCallback((msg, isErr = false) => {
        setToast({ msg, err: isErr, show: true });
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3400);
    }, []);

    return (
        <ToastCtx.Provider value={showToast}>
            {children}
            <div className={'toast' + (toast.show ? ' show' : '') + (toast.err ? ' err' : '')} id="toast">
                <div className="toast-dot"></div>
                <span>{toast.msg}</span>
            </div>
        </ToastCtx.Provider>
    );
}
