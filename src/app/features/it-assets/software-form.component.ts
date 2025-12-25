import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SoftwareService } from '../../core/services';
import { SoftwareCreate } from '../../core/models';

@Component({
  selector: 'app-software-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-base-200">
      <div class="navbar bg-base-100 shadow-lg sticky top-0 z-10">
        <div class="flex-1">
          <button class="btn btn-ghost btn-circle" (click)="goBack()">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-xl font-bold ml-2">{{ isEdit() ? 'Edit Software' : 'Add Software' }}</h1>
        </div>
      </div>

      <div class="container mx-auto p-4 max-w-3xl">
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <form (ngSubmit)="onSubmit()">
              <!-- Basic Info -->
              <h3 class="font-bold text-lg mb-4">Basic Information</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Instance Name *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., nginx-prod"
                    class="input input-bordered w-full"
                    [(ngModel)]="form.instance"
                    name="instance"
                    required
                  />
                </div>
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Class *</span>
                  </label>
                  <select class="select select-bordered w-full" [(ngModel)]="form.class" name="class" required>
                    <option value="">Select Class</option>
                    <option value="Web Server">Web Server</option>
                    <option value="Database">Database</option>
                    <option value="Cache">Cache</option>
                    <option value="Monitoring">Monitoring</option>
                    <option value="CI/CD">CI/CD</option>
                    <option value="Version Control">Version Control</option>
                    <option value="Authentication">Authentication</option>
                    <option value="Storage">Storage</option>
                    <option value="Backup">Backup</option>
                    <option value="Container">Container</option>
                    <option value="Proxy">Proxy</option>
                    <option value="Mail">Mail</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div class="form-control w-full mt-4">
                <label class="label">
                  <span class="label-text">Description</span>
                </label>
                <textarea
                  placeholder="Brief description of this software"
                  class="textarea textarea-bordered w-full"
                  [(ngModel)]="form.description"
                  name="description"
                  rows="2"
                ></textarea>
              </div>

              <div class="divider"></div>

              <!-- Network -->
              <h3 class="font-bold text-lg mb-4">Network</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">IP Address</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 192.168.1.100"
                    class="input input-bordered w-full font-mono"
                    [(ngModel)]="form.ipAddress"
                    name="ipAddress"
                  />
                </div>
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Port</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 8080"
                    class="input input-bordered w-full"
                    [(ngModel)]="form.port"
                    name="port"
                    min="0"
                    max="65535"
                  />
                </div>
                <div class="form-control">
                  <label class="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      class="toggle toggle-info"
                      [(ngModel)]="form.https"
                      name="https"
                    />
                    <span class="label-text">HTTPS</span>
                  </label>
                </div>
              </div>

              <div class="divider"></div>

              <!-- URLs -->
              <h3 class="font-bold text-lg mb-4">Access URLs</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Local URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://localhost:8080"
                    class="input input-bordered w-full"
                    [(ngModel)]="form.local"
                    name="local"
                  />
                </div>
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Global URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://app.example.com"
                    class="input input-bordered w-full"
                    [(ngModel)]="form.global"
                    name="global"
                  />
                </div>
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Documentation Link</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://docs.example.com"
                    class="input input-bordered w-full"
                    [(ngModel)]="form.link"
                    name="link"
                  />
                </div>
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Docker Compose Link</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://gitea.internal/compose"
                    class="input input-bordered w-full"
                    [(ngModel)]="form.dockerComposeLink"
                    name="dockerComposeLink"
                  />
                </div>
              </div>

              <div class="divider"></div>

              <!-- Credentials -->
              <h3 class="font-bold text-lg mb-4">Credentials</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    placeholder="admin@example.com"
                    class="input input-bordered w-full"
                    [(ngModel)]="form.email"
                    name="email"
                  />
                </div>
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Username</span>
                  </label>
                  <input
                    type="text"
                    placeholder="admin"
                    class="input input-bordered w-full"
                    [(ngModel)]="form.username"
                    name="username"
                  />
                </div>
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Password</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    class="input input-bordered w-full"
                    [(ngModel)]="form.password"
                    name="password"
                  />
                </div>
              </div>

              <div class="divider"></div>

              <!-- Additional -->
              <h3 class="font-bold text-lg mb-4">Additional Information</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Install Date</span>
                  </label>
                  <input
                    type="date"
                    class="input input-bordered w-full"
                    [(ngModel)]="form.installDate"
                    name="installDate"
                  />
                </div>
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Other Useful Components</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., plugin1, extension2"
                    class="input input-bordered w-full"
                    [(ngModel)]="form.otherUsefulComponents"
                    name="otherUsefulComponents"
                  />
                </div>
              </div>

              <div class="divider"></div>

              <!-- Status -->
              <h3 class="font-bold text-lg mb-4">Status</h3>
              <div class="flex flex-wrap gap-6">
                <div class="form-control">
                  <label class="label cursor-pointer justify-start gap-4">
                    <input type="checkbox" class="toggle toggle-primary" [(ngModel)]="form.setup" name="setup" />
                    <span class="label-text">Setup Complete</span>
                  </label>
                </div>
                <div class="form-control">
                  <label class="label cursor-pointer justify-start gap-4">
                    <input type="checkbox" class="toggle toggle-success" [(ngModel)]="form.done" name="done" />
                    <span class="label-text">Done</span>
                  </label>
                </div>
              </div>

              <div class="divider"></div>

              <!-- Submit -->
              <div class="flex justify-end gap-2">
                <button type="button" class="btn btn-ghost" (click)="goBack()">Cancel</button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="saving() || !form.instance || !form.class"
                >
                  @if (saving()) {
                    <span class="loading loading-spinner loading-sm"></span>
                  }
                  {{ isEdit() ? 'Save Changes' : 'Create Software' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SoftwareFormComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private softwareService = inject(SoftwareService);

  isEdit = signal(false);
  saving = signal(false);
  softwareId = signal<number | null>(null);

  form: SoftwareCreate = {
    setup: false,
    done: false,
    class: '',
    instance: '',
    description: '',
    https: false,
    ipAddress: '',
    port: 0,
    local: '',
    global: '',
    email: '',
    username: '',
    password: '',
    installDate: '',
    link: '',
    dockerComposeLink: '',
    otherUsefulComponents: '',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit.set(true);
      this.softwareId.set(Number(id));
      this.loadSoftware(Number(id));
    }
  }

  private loadSoftware(id: number): void {
    this.softwareService.getById(id).subscribe({
      next: (software) => {
        this.form = {
          setup: software.setup,
          done: software.done,
          class: software.class,
          instance: software.instance,
          description: software.description,
          https: software.https,
          ipAddress: software.ipAddress,
          port: software.port,
          local: software.local,
          global: software.global,
          email: software.email,
          username: software.username,
          password: software.password,
          installDate: software.installDate,
          link: software.link,
          dockerComposeLink: software.dockerComposeLink,
          otherUsefulComponents: software.otherUsefulComponents,
        };
      },
    });
  }

  onSubmit(): void {
    if (!this.form.instance || !this.form.class) return;

    this.saving.set(true);

    const request = this.isEdit()
      ? this.softwareService.update(this.softwareId()!, this.form)
      : this.softwareService.create(this.form);

    request.subscribe({
      next: (software) => {
        this.saving.set(false);
        this.router.navigate(['/it-assets/software', software.id]);
      },
      error: () => this.saving.set(false),
    });
  }

  goBack(): void {
    if (this.isEdit() && this.softwareId()) {
      this.router.navigate(['/it-assets/software', this.softwareId()]);
    } else {
      this.router.navigate(['/it-assets/software']);
    }
  }
}
