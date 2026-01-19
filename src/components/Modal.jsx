import React from 'react';

/**
 * A reusable modal component for confirm dialogs and alerts
 * 
 * Props:
 * - isOpen: boolean - whether the modal is visible
 * - title: string - optional title for the modal
 * - message: string - the message to display
 * - type: 'confirm' | 'alert' - determines button layout
 * - onConfirm: function - called when OK/Confirm is clicked
 * - onCancel: function - called when Cancel is clicked (confirm mode only)
 * - confirmText: string - text for confirm button (default: 'OK')
 * - cancelText: string - text for cancel button (default: 'キャンセル')
 * - confirmStyle: 'primary' | 'danger' - style of confirm button
 */
export function Modal({
    isOpen,
    title,
    message,
    type = 'alert',
    onConfirm,
    onCancel,
    confirmText = 'OK',
    cancelText = 'キャンセル',
    confirmStyle = 'primary'
}) {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            if (type === 'alert') {
                onConfirm?.();
            } else {
                onCancel?.();
            }
        }
    };

    return (
        <div
            onClick={handleBackdropClick}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                animation: 'fadeIn 0.2s ease-out'
            }}
        >
            <div
                style={{
                    background: 'var(--bg-card, white)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    minWidth: '320px',
                    maxWidth: '450px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    animation: 'slideUp 0.2s ease-out'
                }}
            >
                {title && (
                    <h3 style={{
                        margin: '0 0 0.75rem 0',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: 'var(--text-main)'
                    }}>
                        {title}
                    </h3>
                )}

                <p style={{
                    margin: '0 0 1.5rem 0',
                    fontSize: '0.95rem',
                    color: 'var(--text-main)',
                    lineHeight: '1.5'
                }}>
                    {message}
                </p>

                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem'
                }}>
                    {type === 'confirm' && (
                        <button
                            onClick={onCancel}
                            style={{
                                padding: '0.5rem 1.25rem',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-secondary, #F3F4F6)',
                                color: 'var(--text-main)',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--bg-hover, #E5E7EB)'}
                            onMouseLeave={(e) => e.target.style.background = 'var(--bg-secondary, #F3F4F6)'}
                        >
                            {cancelText}
                        </button>
                    )}

                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: confirmStyle === 'danger' ? '#EF4444' : 'var(--primary)',
                            color: 'white',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
    );
}

/**
 * Hook to use confirm/alert modals
 * Returns [ModalComponent, showConfirm, showAlert]
 */
export function useModal() {
    const [modalState, setModalState] = React.useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'alert',
        confirmStyle: 'primary',
        confirmText: 'OK',
        cancelText: 'キャンセル',
        onConfirm: null,
        onCancel: null
    });

    const showConfirm = React.useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true,
                title: options.title || '',
                message,
                type: 'confirm',
                confirmStyle: options.confirmStyle || 'primary',
                confirmText: options.confirmText || 'OK',
                cancelText: options.cancelText || 'キャンセル',
                onConfirm: () => {
                    setModalState(prev => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setModalState(prev => ({ ...prev, isOpen: false }));
                    resolve(false);
                }
            });
        });
    }, []);

    const showAlert = React.useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true,
                title: options.title || '',
                message,
                type: 'alert',
                confirmStyle: options.confirmStyle || 'primary',
                confirmText: options.confirmText || 'OK',
                cancelText: 'キャンセル',
                onConfirm: () => {
                    setModalState(prev => ({ ...prev, isOpen: false }));
                    resolve();
                },
                onCancel: null
            });
        });
    }, []);

    const ModalComponent = (
        <Modal
            isOpen={modalState.isOpen}
            title={modalState.title}
            message={modalState.message}
            type={modalState.type}
            confirmStyle={modalState.confirmStyle}
            confirmText={modalState.confirmText}
            cancelText={modalState.cancelText}
            onConfirm={modalState.onConfirm}
            onCancel={modalState.onCancel}
        />
    );

    return [ModalComponent, showConfirm, showAlert];
}
