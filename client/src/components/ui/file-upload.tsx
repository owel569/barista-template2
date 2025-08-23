
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Progress } from "./progress"
import { X, Upload, File, Image as ImageIcon, AlertCircle } from "lucide-react"

export interface FileUploadProps {
  onUpload: (files: File[]) => void | Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  showPreview?: boolean;
  dragAndDrop?: boolean;
}

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  error?: string;
  preview?: string;
}

export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({
    onUpload,
    accept,
    multiple = false,
    maxSize = 10, // 10MB par défaut
    maxFiles = 5,
    disabled = false,
    className,
    children,
    showPreview = true,
    dragAndDrop = true,
    ...props
  }, ref) => {
    const [files, setFiles] = React.useState<UploadedFile[]>([]);
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        return `Le fichier est trop volumineux (max: ${maxSize}MB)`;
      }
      if (accept && !accept.split(',').some(type => 
        file.type.match(type.trim();|| file.name.match(type.trim();) {
        return "Type de fichier non supporté";
      }
      return null;
    };

    const createFilePreview = (file: File): Promise<string | undefined> => {
      return new Promise((resolve) => {
        if (file.type.startsWith('image/');{
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        } else {
          resolve(undefined);
        }
      });
    };

    const handleFiles = async (fileList: FileList | File[]) => {
      const newFiles: UploadedFile[] = [];
      const fileArray = Array.from(fileList);

      if (files.length + fileArray.length > maxFiles) {
        alert(`Vous ne pouvez uploader que ${maxFiles} fichiers maximum`);
        return;
      }

      for (const file of fileArray) {
        const error = validateFile(file);
        const preview = await createFilePreview(file);
        
        newFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          progress: 0,
          error,
          preview,
        });
      }

      setFiles(prev => [...prev, ...newFiles]);

      // Simuler l'upload avec progress
      setIsUploading(true);
      const validFiles = newFiles.filter(f => !f.error);
      
      if (validFiles.length > 0) {
        try {
          await onUpload(validFiles.map(f => f.file);
          // Simuler le progrès
          for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 100);
            setFiles(prev => prev.map(f => 
              validFiles.some(vf => vf.id === f.id) 
                ? { ...f, progress: i }
                : f
            );
          }
        } catch (error) {
          setFiles(prev => prev.map(f => 
            validFiles.some(vf => vf.id === f.id)
              ? { ...f, error: "Erreur lors de l'upload" }
              : f
          );
        }
      }
      setIsUploading(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    };

    const handleDragLeave = () => {
      setIsDragOver(false);
    };

    const removeFile = (id: string) => {
      setFiles(prev => prev.filter(f => f.id !== id);
    };

    const openFileDialog = () => {
      fileInputRef.current?.click();
    };

    return (
      <div ref={ref} className={cn("space-y-4", className} {...props}>
        {/* Zone de drop */}
        <div
          className={cn(
            "relative rounded-lg border-2 border-dashed p-6 text-center transition-colors",
            isDragOver 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25",
            disabled && "opacity-50 cursor-not-allowed",
            dragAndDrop && !disabled && "cursor-pointer hover:border-primary hover:bg-primary/5"
          }
          onDrop={dragAndDrop ? handleDrop : undefined}
          onDragOver={dragAndDrop ? handleDragOver : undefined}
          onDragLeave={dragAndDrop ? handleDragLeave : undefined}
          onClick={!disabled ? openFileDialog : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files}
          />
          
          {children || (
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">
                  {dragAndDrop ? "Glissez vos fichiers ici ou " : ""}
                  <Button variant="link" className="h-auto p-0" type="button">
                    cliquez pour parcourir
                  </Button>
                </p>
                <p className="text-muted-foreground">
                  {accept && `Formats acceptés: ${accept}`}
                  {maxSize && ` • Max: ${maxSize}MB`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Liste des fichiers */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center space-x-3 rounded-md border p-3"
              >
                {showPreview && uploadedFile.preview ? (
                  <img
                    src={uploadedFile.preview}
                    alt={uploadedFile.file.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                    {uploadedFile.file.type.startsWith('image/') ? (
                      <ImageIcon className="h-5 w-5" />
                    ) : (
                      <File className="h-5 w-5" />
                    }
                  </div>
                )}
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{uploadedFile.file.name}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadedFile.id}
                      className="h-auto p-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {uploadedFile.error ? (
                    <div className="flex items-center space-x-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      <span>{uploadedFile.error}</span>
                    </div>
                  ) : uploadedFile.progress < 100 ? (
                    <Progress value={uploadedFile.progress} className="h-1" />
                  ) : (
                    <p className="text-xs text-green-600">✓ Uploadé</p>
                  )}
                </div>
              </div>
            );}
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";
