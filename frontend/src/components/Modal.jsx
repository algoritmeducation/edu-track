export default function Modal({ open, onClose, children, className = '' }) {
    if (!open) return null;
    return (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={'modal ' + className}>
                {children}
            </div>
        </div>
    );
}
