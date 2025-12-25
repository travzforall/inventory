import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  IdTemplate,
  IdTemplateCreate,
  IdTemplateUpdate,
  IdSegment,
  SegmentValue,
} from '../models/id-template.model';

const STORAGE_KEY = 'homely_id_templates';

// Default templates pre-seeded for common use cases
const DEFAULT_TEMPLATES: IdTemplateCreate[] = [
  {
    name: 'Screws',
    category: 'Hardware',
    segments: [
      {
        name: 'Material',
        position: 0,
        type: 'select',
        options: [
          { code: 'W', label: 'Wood' },
          { code: 'M', label: 'Metal' },
          { code: 'S', label: 'Stainless' },
        ],
      },
      {
        name: 'Use',
        position: 1,
        type: 'select',
        options: [
          { code: 'I', label: 'Interior' },
          { code: 'E', label: 'Exterior' },
        ],
      },
      {
        name: 'Head',
        position: 2,
        type: 'select',
        options: [
          { code: 'P', label: 'Phillips' },
          { code: 'F', label: 'Flat' },
          { code: 'H', label: 'Hex' },
          { code: 'T', label: 'Torx' },
        ],
      },
      {
        name: 'Length',
        position: 3,
        type: 'number',
        suffix: '',
      },
    ],
  },
  {
    name: 'Audio Cables',
    category: 'Cables',
    segments: [
      {
        name: 'Type',
        position: 0,
        type: 'select',
        options: [
          { code: 'Q', label: '1/4" TRS' },
          { code: 'q', label: '1/4" TS' },
          { code: 'M', label: '3.5mm' },
          { code: 'R', label: 'RCA' },
          { code: 'X', label: 'XLR' },
        ],
      },
      {
        name: 'Length',
        position: 1,
        type: 'select',
        options: [
          { code: '3', label: '3ft' },
          { code: '6', label: '6ft' },
          { code: '10', label: '10ft' },
          { code: '25', label: '25ft' },
        ],
      },
      {
        name: 'Connector',
        position: 2,
        type: 'select',
        options: [
          { code: 'MM', label: 'Male-Male' },
          { code: 'MF', label: 'Male-Female' },
        ],
      },
    ],
  },
  {
    name: 'Video Cables',
    category: 'Cables',
    segments: [
      {
        name: 'Type',
        position: 0,
        type: 'select',
        options: [
          { code: 'H', label: 'HDMI' },
          { code: 'D', label: 'DisplayPort' },
          { code: 'V', label: 'VGA' },
          { code: 'U', label: 'USB-C' },
        ],
      },
      {
        name: 'Version',
        position: 1,
        type: 'select',
        options: [
          { code: '1', label: '1.4/1.2' },
          { code: '2', label: '2.0/2.1' },
        ],
      },
      {
        name: 'Length',
        position: 2,
        type: 'select',
        options: [
          { code: '3', label: '3ft' },
          { code: '6', label: '6ft' },
          { code: '10', label: '10ft' },
          { code: '15', label: '15ft' },
        ],
      },
    ],
  },
  {
    name: 'Books',
    category: 'Media',
    segments: [
      {
        name: 'Genre',
        position: 0,
        type: 'select',
        options: [
          { code: 'F', label: 'Fiction' },
          { code: 'N', label: 'Non-Fiction' },
          { code: 'T', label: 'Technical' },
          { code: 'R', label: 'Reference' },
        ],
      },
      {
        name: 'Identifier',
        position: 1,
        type: 'text',
      },
    ],
  },
];

@Injectable({
  providedIn: 'root',
})
export class IdTemplateService {
  private templates = signal<IdTemplate[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.templates.set(JSON.parse(stored));
      } else {
        // Initialize with default templates
        this.seedDefaults();
      }
    } catch (error) {
      console.error('Error loading templates from localStorage:', error);
      this.seedDefaults();
    }
  }

  private seedDefaults(): void {
    const now = new Date().toISOString();
    const defaults: IdTemplate[] = DEFAULT_TEMPLATES.map((t, index) => ({
      ...t,
      id: index + 1,
      createdAt: now,
      updatedAt: now,
    }));
    this.templates.set(defaults);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.templates()));
    } catch (error) {
      console.error('Error saving templates to localStorage:', error);
    }
  }

  private getNextId(): number {
    const templates = this.templates();
    if (templates.length === 0) return 1;
    return Math.max(...templates.map((t) => t.id)) + 1;
  }

  getAll(): Observable<IdTemplate[]> {
    return of(this.templates());
  }

  getById(id: number): Observable<IdTemplate | undefined> {
    return of(this.templates().find((t) => t.id === id));
  }

  create(data: IdTemplateCreate): Observable<IdTemplate> {
    const now = new Date().toISOString();
    const newTemplate: IdTemplate = {
      ...data,
      id: this.getNextId(),
      createdAt: now,
      updatedAt: now,
    };
    this.templates.update((templates) => [...templates, newTemplate]);
    this.saveToStorage();
    return of(newTemplate);
  }

  update(id: number, data: IdTemplateUpdate): Observable<IdTemplate | undefined> {
    let updated: IdTemplate | undefined;
    this.templates.update((templates) =>
      templates.map((t) => {
        if (t.id === id) {
          updated = {
            ...t,
            ...data,
            updatedAt: new Date().toISOString(),
          };
          return updated;
        }
        return t;
      })
    );
    this.saveToStorage();
    return of(updated);
  }

  delete(id: number): Observable<boolean> {
    const before = this.templates().length;
    this.templates.update((templates) => templates.filter((t) => t.id !== id));
    this.saveToStorage();
    return of(this.templates().length < before);
  }

  /**
   * Generate an ID/SKU from a template and segment values
   * @param template The ID template to use
   * @param values Array of segment values
   * @returns Generated ID string
   */
  generateId(template: IdTemplate, values: SegmentValue[]): string {
    // Sort segments by position
    const sortedSegments = [...template.segments].sort((a, b) => a.position - b.position);

    let id = '';
    for (const segment of sortedSegments) {
      const value = values.find((v) => v.segmentName === segment.name);
      if (value && value.value) {
        if (segment.prefix) {
          id += segment.prefix;
        }
        id += value.value;
        if (segment.suffix) {
          id += segment.suffix;
        }
      }
    }
    return id;
  }

  /**
   * Generate an example ID showing the pattern
   * @param template The ID template
   * @returns Example ID string with placeholders
   */
  generateExampleId(template: IdTemplate): string {
    const sortedSegments = [...template.segments].sort((a, b) => a.position - b.position);

    let example = '';
    for (const segment of sortedSegments) {
      if (segment.prefix) {
        example += segment.prefix;
      }

      if (segment.type === 'select' && segment.options && segment.options.length > 0) {
        example += segment.options[0].code;
      } else if (segment.type === 'number') {
        example += '##';
      } else {
        example += '...';
      }

      if (segment.suffix) {
        example += segment.suffix;
      }
    }
    return example;
  }

  /**
   * Generate a human-readable name from segment values
   * @param template The ID template
   * @param values Array of segment values
   * @returns Human-readable name
   */
  generateName(template: IdTemplate, values: SegmentValue[]): string {
    const parts: string[] = [template.name];

    for (const segment of template.segments) {
      const value = values.find((v) => v.segmentName === segment.name);
      if (value && value.value) {
        if (segment.type === 'select' && segment.options) {
          const option = segment.options.find((o) => o.code === value.value);
          if (option) {
            parts.push(option.label);
          }
        } else {
          parts.push(value.value + (segment.suffix || ''));
        }
      }
    }

    return parts.join(' ');
  }

  /**
   * Reset templates to defaults
   */
  resetToDefaults(): void {
    this.seedDefaults();
  }
}
