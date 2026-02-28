import Modal from './Modal';

export default function ConfirmModal({ open, onClose, onConfirm, message, loading }) {
    return (
        <Modal open={open} onClose={onClose} className="confirm-modal">
            <div className="modal-hd">
                <div><div className="modal-title">Confirm Delete</div></div>
                <button className="modal-close" onClick={onClose}>×</button>
            </div>
            <div className="confirm-msg" dangerouslySetInnerHTML={{ __html: message }}></div>
            <div className="modal-actions">
                <button
                    className="btn-submit"
                    style={{ background: 'var(--red)', borderColor: 'var(--red)' }}
                    onClick={onConfirm}
                    disabled={loading}
                >
                    {loading ? 'Deleting...' : 'Delete'}
                </button>
                <button className="btn-cancel" onClick={onClose}>Cancel</button>
            </div>
        </Modal>
    );
}
