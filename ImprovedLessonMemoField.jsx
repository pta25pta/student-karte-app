import React, { useState, useRef } from 'react';

/**
 * 画像の貼り付け・ドロップ対応 TextArea コンポーネント
 */
export function ImprovedLessonMemoField({ label, value, onChange, placeholder }) {
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef(null);

  // 指定した位置にテキストを挿入するユーティリティ
  const insertText = (text) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    
    const newText = currentText.substring(0, start) + text + currentText.substring(end);
    onChange(newText);

    // カーソル位置を挿入したテキストの後ろに移動 (setTimeoutでDOM更新を待つ)
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  };

  // 画像アップロード処理
  const uploadFile = async (file) => {
    setIsUploading(true);
    const tempId = Math.random().toString(36).substring(7);
    const placeholderText = `\n![Uploading ${file.name}...](uploading-${tempId})\n`;
    
    // カーソル位置にプレースホルダーを挿入
    insertText(placeholderText);

    try {
      // Base64に変換
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
      const dataUrl = await base64Promise;
      const base64Data = dataUrl.split(',')[1];

      // GASまたはAPIを呼び出し
      // 1. GAS google.script.run を使う場合
      if (window.google && window.google.script && window.google.script.run) {
        window.google.script.run
          .withSuccessHandler((res) => {
            handleUploadSuccess(res, placeholderText);
          })
          .withFailureHandler((err) => {
            handleUploadError(err, placeholderText);
          })
          .uploadImage(base64Data, file.type, file.name);
      } 
      // 2. 既存の Vercel API (Node.js) を使う場合
      else {
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: dataUrl,
            fileName: file.name
          })
        });
        const res = await response.json();
        handleUploadSuccess(res, placeholderText);
      }
    } catch (err) {
      handleUploadError(err, placeholderText);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadSuccess = (res, placeholderText) => {
    if (res.success || res.url) {
      const markdown = `\n![image](${res.url})\n`;
      const currentVal = textareaRef.current.value;
      const newVal = currentVal.replace(placeholderText, markdown);
      onChange(newVal);
    } else {
      handleUploadError(res.error, placeholderText);
    }
  };

  const handleUploadError = (err, placeholderText) => {
    console.error('Upload failed:', err);
    const currentVal = textareaRef.current.value;
    const newVal = currentVal.replace(placeholderText, '\n> [!ERROR] Upload failed\n');
    onChange(newVal);
  };

  // 貼り付けイベント
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) uploadFile(file);
        break;
      }
    }
  };

  // ドロップイベント
  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        uploadFile(file);
        break; // 複数枚同時は今回は1枚のみ対応
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '12px', fontWeight: 'bold' }}>{label}</label>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        placeholder={placeholder}
        style={{
          width: '100%',
          minHeight: '150px',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          fontFamily: 'monospace'
        }}
      />
      {isUploading && <div style={{ fontSize: '11px', color: '#666' }}>⌛ アップロード中...</div>}
    </div>
  );
}
