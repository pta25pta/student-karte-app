import React from 'react';

/**
 * A reusable modal component for confirm dialogs, alerts, and image expansion
 * 
 * Props:
 * - isOpen: boolean - whether the modal is visible
 * - title: string - optional title for the modal
 * - message: string - the message to display
 * - type: 'confirm' | 'alert' | 'image' - determines button layout
 * - imageUrl: string - URL of the image to display (image type only)
 * - onConfirm: function - called when OK/Confirm is clicked
 * - onCancel: function - called when Cancel/Close is clicked
 * - confirmText: string - text for confirm button (default: 'OK')
 * - cancelText: string - text for cancel button (default: 'キャンセル')
 * - confirmStyle: 'primary' | 'danger' - style of confirm button
 */
export function Modal({
    isOpen,
    title,
    message,
    type = 'alert',
    imageUrl,
    onConfirm,
    onCancel,
    confirmText = 'OK',
    cancelText = 'キャンセル',
    confirmStyle = 'primary'
}) {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            if (type === 'image') {
                onCancel?.();
            } else if (type === 'alert') {
                onConfirm?.();
            } else {
                onCancel?.();
            }
        }
    };

    if (type === 'image') {
        return (
            <div
                onClick={handleBackdropClick}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    animation: 'fadeIn 0.2s ease-out',
                    cursor: 'zoom-out'
                }}
            >
                <div style={{ position: 'relative', maxWidth: '95vw', maxHeight: '95vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img
                        src={imageUrl}
                        alt="Zoomed"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '90vh',
                            objectFit: 'contain',
                            borderRadius: '4px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                            animation: 'zoomIn 0.2s ease-out',
                            backgroundColor: 'white'
                        }}
                    />
                    <button
                        onClick={onCancel}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1.5rem',
                            background: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                        }}
                    >
                        閉じる
                    </button>
                    {message && (
                        <p style={{ color: 'white', marginTop: '0.5rem', fontSize: '0.9rem', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                            {message}
                        </p>
                    )}
                </div>
                <style>{`
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                `}</style>
            </div>
        );
    }

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
 * Returns [ModalComponent, showConfirm, showAlert, showImage]
 */
export function useModal() {
    const [modalState, setModalState] = React.useState({
        isOpen: false,
        title: '',
        message: '',
        imageUrl: '',
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
                imageUrl: '',
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
                imageUrl: '',
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

    const showImage = React.useCallback((imageUrl, message = '') => {
        setModalState({
            isOpen: true,
            title: '',
            message,
            imageUrl,
            type: 'image',
            onConfirm: () => setModalState(prev => ({ ...prev, isOpen: false })),
            onCancel: () => setModalState(prev => ({ ...prev, isOpen: false })),
            confirmText: '閉じる',
            cancelText: '閉じる',
            confirmStyle: 'primary'
        });
    }, []);

    const ModalComponent = (
        <Modal
            isOpen={modalState.isOpen}
            title={modalState.title}
            message={modalState.message}
            imageUrl={modalState.imageUrl}
            type={modalState.type}
            confirmStyle={modalState.confirmStyle}
            confirmText={modalState.confirmText}
            cancelText={modalState.cancelText}
            onConfirm={modalState.onConfirm}
            onCancel={modalState.onCancel}
        />
    );

    return [ModalComponent, showConfirm, showAlert, showImage];
}
