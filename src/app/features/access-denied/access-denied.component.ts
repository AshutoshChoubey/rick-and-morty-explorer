import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import * as RoleActions from '../../core/store/role/role.actions';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <main class="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <mat-card class="max-w-xl w-full !bg-slate-900/90 !border !border-rose-500/30 !rounded-2xl p-6 sm:p-10 !shadow-2xl shadow-rose-950/40 backdrop-blur-xl text-center relative overflow-hidden">
        
        <div class="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-rose-950 via-rose-900/60 to-amber-900/40 border border-rose-500/40 flex items-center justify-center shadow-xl shadow-rose-950/50 mb-6 group">
          <mat-icon class="!text-5xl !w-12 !h-12 text-rose-400">shield_lock</mat-icon>
        </div>

        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono tracking-wider mb-4 mx-auto">
          <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span>HTTP 403 • ACCESS FORBIDDEN</span>
        </div>

        <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Access Restricted
        </h1>

        <p class="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
          Your current session role is set to 
          <span class="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold font-mono">VIEWER</span>. 
          Viewers can browse the character catalog. Character details and episode records require 
          <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono">ADMIN</span> authorization.
        </p>

        @if (attemptedUrl) {
          <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-6 text-left">
            <span class="text-[11px] font-mono uppercase text-slate-400 block mb-1">Restricted Route Attempted:</span>
            <code class="text-xs font-mono text-rose-300 bg-rose-950/40 px-2 py-1 rounded border border-rose-900/50 block truncate">
              {{ attemptedUrl }}
            </code>
          </div>
        }

        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            mat-flat-button
            (click)="elevateToAdmin()"
            class="!bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 !text-slate-950 !font-bold !py-3 !px-6 !rounded-xl !shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2">
            <mat-icon class="!w-5 !h-5 mr-1">admin_panel_settings</mat-icon>
            <span>Switch to Admin & Unlock</span>
          </button>

          <a
            routerLink="/"
            mat-stroked-button
            class="!text-slate-200 !border-slate-700 hover:!border-slate-600 !py-3 !px-5 !rounded-xl flex items-center justify-center gap-2">
            <mat-icon class="!w-4 !h-4 mr-1">arrow_back</mat-icon>
            <span>Return to Characters</span>
          </a>
        </div>

        <div class="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400">
          Tip: You can switch between Admin and Viewer anytime using the role toggle in the top navigation bar.
        </div>

      </mat-card>
    </main>
  `
})
export class AccessDeniedComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  attemptedUrl: string = '';

  ngOnInit(): void {
    this.attemptedUrl = this.route.snapshot.queryParamMap.get('attempted') || '';
  }

  elevateToAdmin(): void {
    this.store.dispatch(RoleActions.setRole({ role: 'ADMIN' }));
    this.store.dispatch(RoleActions.clearAccessDenied());
    if (this.attemptedUrl) {
      this.router.navigateByUrl(this.attemptedUrl);
    } else {
      this.router.navigate(['/']);
    }
  }
}
