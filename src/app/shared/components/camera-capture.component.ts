import { Component, output, signal, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-camera-capture',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <!-- Captured Images Preview -->
      @if (capturedImages().length > 0) {
        <div class="grid grid-cols-3 gap-2">
          @for (img of capturedImages(); track $index) {
            <div class="relative">
              <img
                [src]="img"
                alt="Captured image"
                class="w-full h-24 object-cover rounded-lg"
              />
              <button
                type="button"
                class="absolute top-1 right-1 btn btn-circle btn-xs btn-error"
                (click)="removeImage($index)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          }
        </div>
      }

      <!-- Camera/File Input Buttons -->
      <div class="flex gap-2">
        <!-- Take Photo Button (Mobile) -->
        <button
          type="button"
          class="btn btn-outline flex-1"
          (click)="openCamera()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Take Photo
        </button>

        <!-- Choose from Gallery -->
        <button
          type="button"
          class="btn btn-outline flex-1"
          (click)="openGallery()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Gallery
        </button>
      </div>

      <!-- Hidden file inputs -->
      <input
        #cameraInput
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden"
        (change)="onFileSelected($event)"
      />
      <input
        #galleryInput
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        (change)="onFileSelected($event)"
      />

      <!-- Help text -->
      <p class="text-xs text-base-content/60 text-center">
        {{ capturedImages().length }} / {{ maxImages }} photos
      </p>
    </div>
  `,
})
export class CameraCaptureComponent {
  cameraInput = viewChild<ElementRef<HTMLInputElement>>('cameraInput');
  galleryInput = viewChild<ElementRef<HTMLInputElement>>('galleryInput');

  capturedImages = signal<string[]>([]);
  maxImages = 5;

  // Output event to parent component
  imagesChanged = output<string[]>();

  openCamera(): void {
    this.cameraInput()?.nativeElement.click();
  }

  openGallery(): void {
    this.galleryInput()?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const files = Array.from(input.files);
    const remainingSlots = this.maxImages - this.capturedImages().length;
    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      this.processFile(file);
    });

    // Reset input so same file can be selected again
    input.value = '';
  }

  private processFile(file: File): void {
    // Compress and convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Max dimensions for compression
        const maxWidth = 800;
        const maxHeight = 800;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        this.addImage(base64);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  private addImage(base64: string): void {
    const current = this.capturedImages();
    if (current.length < this.maxImages) {
      const updated = [...current, base64];
      this.capturedImages.set(updated);
      this.imagesChanged.emit(updated);
    }
  }

  removeImage(index: number): void {
    const current = this.capturedImages();
    const updated = current.filter((_, i) => i !== index);
    this.capturedImages.set(updated);
    this.imagesChanged.emit(updated);
  }

  // Method to set initial images (for editing)
  setImages(images: string[]): void {
    this.capturedImages.set(images);
  }

  // Method to clear all images
  clear(): void {
    this.capturedImages.set([]);
    this.imagesChanged.emit([]);
  }
}
