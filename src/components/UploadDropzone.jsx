import { useState } from 'react';

function UploadDropzone({
  icon: Icon,
  formatLabel,
  buttonLabel,
  uploadingLabel = 'Envoi...',
  accept,
  multiple = false,
  disabled = false,
  uploading = false,
  onFiles,
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length > 0) onFiles(files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled && !uploading) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!disabled && !uploading) handleFiles(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition ${
        dragOver ? 'border-rose-400 bg-rose-50' : 'border-gray-300 bg-white'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300">
        <Icon className="h-8 w-8" />
      </div>
      <p className="mt-3 text-xs text-gray-400">{formatLabel}</p>
      <p className="mt-4 text-sm text-gray-600">Faites glisser et déposez vos fichiers ici.</p>
      <label className="mt-4 inline-block cursor-pointer rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">
        {uploading ? uploadingLabel : buttonLabel}
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
          disabled={disabled || uploading}
        />
      </label>
    </div>
  );
}

export default UploadDropzone;
