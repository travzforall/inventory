import { Injectable } from '@angular/core';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

export interface QRCodeConfig {
  baseUrl: string;
  prefix: string;
  type: 'location' | 'item';
  // Additional data fields for richer QR codes
  category?: string;
  description?: string;
  parentLocation?: string;
  sku?: string;
  defaultQuantity?: number;
  minQuantity?: number;
  unit?: string;
  tags?: string[];
  notes?: string;
  manageInventory?: boolean;
  // Item-specific: pre-assign to location
  defaultLocationId?: number;
  defaultLocationName?: string;
  // Location-specific: capacity rules
  maxItems?: number;
  maxWeight?: number;
  weightUnit?: 'kg' | 'lb';
  allowedCategories?: string[];
}

export interface QRCodeItem {
  id: string;
  url: string;
  dataUrl: string;
  name: string;
}

export interface PDFConfig {
  labelSize: 'small' | 'medium' | 'large' | 'custom';
  customWidth?: number;
  customHeight?: number;
  columns: number;
  showLabel: boolean;
  showUrl: boolean;
}

// Label sizes in mm
const LABEL_SIZES = {
  small: { width: 25, height: 25 },   // 1 inch
  medium: { width: 50, height: 50 },  // 2 inch
  large: { width: 75, height: 75 },   // 3 inch
};

@Injectable({
  providedIn: 'root',
})
export class QRCodeService {
  /**
   * Generate a unique ID for QR codes
   */
  generateUniqueId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate multiple unique QR codes
   */
  async generateQRCodes(
    count: number,
    config: QRCodeConfig
  ): Promise<QRCodeItem[]> {
    const codes: QRCodeItem[] = [];

    for (let i = 0; i < count; i++) {
      const id = this.generateUniqueId(config.prefix);
      const url = this.buildQRCodeUrl(id, config);

      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 1,
        errorCorrectionLevel: 'M',
      });

      codes.push({
        id,
        url,
        dataUrl,
        name: id,
      });
    }

    return codes;
  }

  /**
   * Build QR code URL with all available data parameters
   * Keeps URL under ~500 chars for reliable scanning
   */
  private buildQRCodeUrl(id: string, config: QRCodeConfig): string {
    const params = new URLSearchParams();

    // Required parameters
    params.set('type', config.type);
    params.set('name', id);

    // Optional parameters - only add if provided
    if (config.category) {
      params.set('cat', config.category);
    }
    if (config.description) {
      // Truncate description to keep URL reasonable
      params.set('desc', config.description.substring(0, 100));
    }
    if (config.parentLocation) {
      params.set('parent', config.parentLocation);
    }
    if (config.sku) {
      params.set('sku', config.sku);
    }
    if (config.defaultQuantity !== undefined && config.defaultQuantity > 0) {
      params.set('qty', config.defaultQuantity.toString());
    }
    if (config.minQuantity !== undefined && config.minQuantity > 0) {
      params.set('minQty', config.minQuantity.toString());
    }
    if (config.unit) {
      params.set('unit', config.unit);
    }
    if (config.tags && config.tags.length > 0) {
      params.set('tags', config.tags.join(','));
    }
    if (config.notes) {
      // Truncate notes to keep URL reasonable
      params.set('notes', config.notes.substring(0, 50));
    }
    if (config.manageInventory !== undefined) {
      params.set('inv', config.manageInventory ? '1' : '0');
    }
    // Item-specific: default location
    if (config.defaultLocationId) {
      params.set('locId', config.defaultLocationId.toString());
    }
    if (config.defaultLocationName) {
      params.set('loc', config.defaultLocationName);
    }
    // Location-specific: capacity rules
    if (config.maxItems !== undefined && config.maxItems > 0) {
      params.set('maxItems', config.maxItems.toString());
    }
    if (config.maxWeight !== undefined && config.maxWeight > 0) {
      params.set('maxWt', config.maxWeight.toString());
    }
    if (config.weightUnit) {
      params.set('wtUnit', config.weightUnit);
    }
    if (config.allowedCategories && config.allowedCategories.length > 0) {
      params.set('allowCat', config.allowedCategories.join(','));
    }

    return `${config.baseUrl}/nfc?${params.toString()}`;
  }

  /**
   * Generate a single QR code for a specific URL
   */
  async generateSingleQRCode(url: string, name: string): Promise<QRCodeItem> {
    const dataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 1,
      errorCorrectionLevel: 'M',
    });

    return {
      id: name,
      url,
      dataUrl,
      name,
    };
  }

  /**
   * Generate PDF with QR codes
   */
  async generatePDF(codes: QRCodeItem[], config: PDFConfig): Promise<Blob> {
    // Get label dimensions
    const labelSize =
      config.labelSize === 'custom'
        ? { width: config.customWidth || 50, height: config.customHeight || 50 }
        : LABEL_SIZES[config.labelSize];

    // A4 page dimensions in mm
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;

    // Calculate grid layout
    const availableWidth = pageWidth - 2 * margin;
    const availableHeight = pageHeight - 2 * margin;

    const columns = config.columns || Math.floor(availableWidth / labelSize.width);
    const rows = Math.floor(availableHeight / labelSize.height);
    const labelsPerPage = columns * rows;

    // Calculate spacing
    const horizontalSpacing = (availableWidth - columns * labelSize.width) / (columns + 1);
    const verticalSpacing = (availableHeight - rows * labelSize.height) / (rows + 1);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let currentPage = 0;
    let labelsOnCurrentPage = 0;

    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];

      // Calculate position on current page
      const col = labelsOnCurrentPage % columns;
      const row = Math.floor(labelsOnCurrentPage / columns);

      const x = margin + horizontalSpacing + col * (labelSize.width + horizontalSpacing);
      const y = margin + verticalSpacing + row * (labelSize.height + verticalSpacing);

      // Calculate QR code size (leave room for label text)
      const textHeight = config.showLabel || config.showUrl ? 8 : 0;
      const qrSize = Math.min(labelSize.width, labelSize.height - textHeight) - 4;
      const qrX = x + (labelSize.width - qrSize) / 2;
      const qrY = y + 2;

      // Add QR code image
      pdf.addImage(code.dataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      // Add label text
      if (config.showLabel || config.showUrl) {
        pdf.setFontSize(6);
        pdf.setTextColor(0, 0, 0);

        const textY = qrY + qrSize + 3;
        const textX = x + labelSize.width / 2;

        if (config.showLabel) {
          pdf.text(code.name, textX, textY, { align: 'center' });
        }

        if (config.showUrl) {
          const shortUrl = code.url.length > 30 ? code.url.substring(0, 30) + '...' : code.url;
          pdf.text(shortUrl, textX, textY + 3, { align: 'center' });
        }
      }

      // Optional: Draw border around label (for cutting guide)
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.1);
      pdf.rect(x, y, labelSize.width, labelSize.height);

      labelsOnCurrentPage++;

      // Check if we need a new page
      if (labelsOnCurrentPage >= labelsPerPage && i < codes.length - 1) {
        pdf.addPage();
        currentPage++;
        labelsOnCurrentPage = 0;
      }
    }

    return pdf.output('blob');
  }

  /**
   * Download PDF
   */
  downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Open PDF in new tab for printing
   */
  printPDF(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }
}
