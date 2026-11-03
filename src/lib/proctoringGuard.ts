/**
 * Cross-Platform Exam Integrity & Proctoring Guard
 *
 * Provides client-side protection for:
 * - Mobile (Android / iOS): Focus loss, app switcher, notification shade blackout
 * - macOS: Capture keys (Cmd+Shift+3/4/5), print (Cmd+P), DevTools (Cmd+Opt+I), blur blackout
 * - Windows: Snipping Tool (Win+Shift+S), PrintScreen, Print (Ctrl+P), DevTools (F12), blur blackout
 * - Multi-touch detection: Catches 2+ finger gestures on mobile to prevent swipe screenshots
 * - Selection suppression: Disables text selection, image drag, and Chrome Google Lens callouts
 * - Auto-sync: Reports infractions & away duration to POST /api/student/tests/:id/violations
 * - Disqualification: Automatically locks screen with 0 MARKS upon reaching 3 screen switches
 */

export type ViolationType =
  | 'MINIMIZE'
  | 'APP_SWITCH'
  | 'FULLSCREEN_EXIT'
  | 'CAPTURE_SHORTCUT'
  | 'BLUR'
  | 'OTHER';

export interface ProctoringGuardOptions {
  testId: string;
  apiBaseUrl?: string;
  getAuthToken?: () => string | null;
  getActiveQuestionNumber?: () => number | undefined;
  onViolation?: (violation: {
    type: ViolationType;
    durationSeconds?: number;
    questionNumber?: number;
    minimizeCount?: number;
    disqualified?: boolean;
    score?: number;
  }) => void;
  onBlackout?: (reason: string) => void;
  onRestore?: () => void;
  overlayElementId?: string;
  maxWarningsBeforeAlert?: number;
  studentInfo?: {
    studentId?: string;
    studentEmail?: string;
    studentName?: string;
  };
  enableWatermark?: boolean;
  watermarkOpacity?: number;
  watermarkElementId?: string;
  requireSecureClient?: boolean;
  onSecureClientMissing?: () => void;
}

export class ProctoringGuard {
  private testId: string;
  private apiBaseUrl: string;
  private getAuthToken?: () => string | null;
  private getActiveQuestionNumber?: () => number | undefined;
  private onViolation?: ProctoringGuardOptions['onViolation'];
  private onBlackout?: ProctoringGuardOptions['onBlackout'];
  private onRestore?: ProctoringGuardOptions['onRestore'];
  private overlayElementId: string;
  private studentInfo?: ProctoringGuardOptions['studentInfo'];
  private enableWatermark: boolean;
  private watermarkOpacity: number;
  private watermarkElementId: string;
  private requireSecureClient: boolean;
  private onSecureClientMissing?: () => void;

  private isRunning: boolean = false;
  private blurTimestamp: number | null = null;
  private overlayEl: HTMLElement | null = null;
  private watermarkCanvas: HTMLCanvasElement | null = null;
  private watermarkObserver: MutationObserver | null = null;
  private watermarkTimer: any = null;
  private cleanupFns: Array<() => void> = [];
  private minimizeCount: number = 0;
  private isDisqualified: boolean = false;

  constructor(options: ProctoringGuardOptions) {
    this.testId = options.testId;
    const defaultApiUrl =
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
      (typeof process !== 'undefined' &&
        ((process as any).env?.NEXT_PUBLIC_API_URL || (process as any).env?.VITE_API_BASE_URL)) ||
      '';
    this.apiBaseUrl = (options.apiBaseUrl !== undefined ? options.apiBaseUrl : defaultApiUrl).replace(/\/$/, '');
    this.getAuthToken = options.getAuthToken;
    this.getActiveQuestionNumber = options.getActiveQuestionNumber;
    this.onViolation = options.onViolation;
    this.onBlackout = options.onBlackout;
    this.onRestore = options.onRestore;
    this.overlayElementId = options.overlayElementId || 'proctor-blackout-overlay';
    this.studentInfo = options.studentInfo;
    this.enableWatermark = options.enableWatermark ?? false;
    this.watermarkOpacity = options.watermarkOpacity ?? 0.12;
    this.watermarkElementId = options.watermarkElementId || 'proctor-forensic-watermark';
    this.requireSecureClient = options.requireSecureClient ?? false;
    this.onSecureClientMissing = options.onSecureClientMissing;
  }

  /**
   * Checks if running inside an authorized OS-level lockdown container.
   */
  public isSecureClient(): boolean {
    if (typeof window === 'undefined') return true;
    const w = window as any;
    return Boolean(
      w.__ELECTRON_SECURE_EXAM_SHELL__ ||
      w.__CAPACITOR_SECURE_EXAM__ ||
      (typeof navigator !== 'undefined' && /SEB/i.test(navigator.userAgent))
    );
  }

  /**
   * Current violation / screen switch count
   */
  public getMinimizeCount(): number {
    return this.minimizeCount;
  }

  /**
   * Whether the exam has been disqualified and permanently locked
   */
  public getIsDisqualified(): boolean {
    return this.isDisqualified;
  }

  /**
   * Initializes all listeners, sets up blackout overlay, forensic watermark, and enforces fullscreen.
   */
  public start(): void {
    if (this.isRunning || typeof window === 'undefined') return;
    this.isRunning = true;

    if (this.requireSecureClient && !this.isSecureClient()) {
      if (this.onSecureClientMissing) {
        this.onSecureClientMissing();
      }
      this.showBlackout(
        'Secure Exam App Required: Please launch this exam from the official Jivanaut Lockdown App to prevent screen capture.',
      );
      this.dispatchViolation('OTHER', undefined, 'Attempted test launch outside verified secure client');
      return;
    }

    this.ensureBlackoutOverlay();
    if (this.enableWatermark) {
      this.ensureForensicWatermark();
    }
    this.attachKeyboardListeners();
    this.attachFocusAndVisibilityListeners();
    this.attachFullscreenListeners();
    this.attachContextMenuAndSelectListeners();
    this.attachMediaCaptureProtection();
    this.attachMobileGestureAndTouchListeners();
  }

  /**
   * Cleans up all listeners, forensic watermarks, and blackout overlay.
   */
  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    for (const fn of this.cleanupFns) {
      try {
        fn();
      } catch {
        // ignore
      }
    }
    this.cleanupFns = [];

    if (this.watermarkTimer) {
      clearInterval(this.watermarkTimer);
      this.watermarkTimer = null;
    }

    if (this.watermarkObserver) {
      this.watermarkObserver.disconnect();
      this.watermarkObserver = null;
    }

    if (this.watermarkCanvas && this.watermarkCanvas.parentElement) {
      this.watermarkCanvas.parentElement.removeChild(this.watermarkCanvas);
      this.watermarkCanvas = null;
    }

    if (this.overlayEl) {
      this.overlayEl.style.display = 'none';
      if (this.overlayEl.parentElement) {
        this.overlayEl.parentElement.removeChild(this.overlayEl);
      }
      this.overlayEl = null;
    }

    if (typeof document !== 'undefined') {
      const stray = document.getElementById(this.overlayElementId);
      if (stray) {
        stray.style.display = 'none';
        if (stray.parentElement) {
          stray.parentElement.removeChild(stray);
        }
      }
    }
  }

  /**
   * Forces the browser to enter fullscreen mode.
   */
  public async requestFullscreen(): Promise<boolean> {
    if (typeof document === 'undefined') return false;
    const elem = document.documentElement as any;
    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
        return true;
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
        return true;
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
        return true;
      }
    } catch {
      // Permission denied or blocked by user
    }
    return false;
  }

  /**
   * Creates an opaque blackout DOM overlay if not already present.
   */
  private ensureBlackoutOverlay(): void {
    if (typeof document === 'undefined') return;
    let el = document.getElementById(this.overlayElementId);
    if (!el) {
      el = document.createElement('div');
      el.id = this.overlayElementId;
      el.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: #000000 !important;
        color: #ffffff;
        z-index: 2147483647 !important;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-family: system-ui, -apple-system, sans-serif;
        text-align: center;
        padding: 24px;
        box-sizing: border-box;
      `;
      document.body.appendChild(el);
    }
    this.overlayEl = el;
  }

  /**
   * Shows the black screen overlay with an explanatory message.
   */
  public showBlackout(reason: string): void {
    if (this.overlayEl) {
      if (this.isDisqualified || this.minimizeCount >= 3) {
        this.overlayEl.innerHTML = `
          <div style="max-width: 520px; text-align: center; color: #ffffff; padding: 24px; box-sizing: border-box;">
            <div style="font-size: 54px; margin-bottom: 16px;">🚫</div>
            <h2 style="font-size: 26px; font-weight: 800; color: #ef4444; margin-bottom: 12px; letter-spacing: -0.5px;">EXAM TERMINATED</h2>
            <div style="background: rgba(239, 68, 68, 0.2); border: 2px solid #ef4444; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
              <p style="font-size: 22px; font-weight: 800; color: #f87171; margin: 0 0 8px 0;">SCORE: 0 MARKS</p>
              <p style="font-size: 14px; color: #fca5a5; margin: 0; line-height: 1.5;">
                You have exceeded the maximum limit of 3 screen switches. Your exam attempt has been automatically closed and marked with 0 marks.
              </p>
            </div>
            <p style="font-size: 13px; color: #9ca3af;">Please inform your teacher or proctor.</p>
          </div>
        `;
      } else {
        this.overlayEl.innerHTML = `
          <div style="max-width: 520px; text-align: center; color: #ffffff; padding: 24px; box-sizing: border-box;">
            <div style="font-size: 48px; margin-bottom: 14px;">⚠️</div>
            <h2 style="font-size: 24px; font-weight: 800; color: #ef4444; margin-bottom: 12px; letter-spacing: -0.5px;">SECURITY ALERT: SCREEN HIDDEN</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #f3f4f6; margin-bottom: 18px;">
              Screen recording, screenshots, app-switching, or leaving this window is strictly prohibited.
            </p>
            <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 8px; padding: 14px 18px; margin-bottom: 18px;">
              <p style="font-size: 14px; font-weight: 700; color: #fca5a5; margin: 0 0 6px 0;">
                STRIKE WARNING: 3 screen switches will automatically terminate your exam with 0 MARKS.
              </p>
              <p style="font-size: 14px; font-weight: 600; color: #ffffff; margin: 0;">
                Current Screen Switches: <span id="proctor-strike-count" style="color: #ef4444; font-size: 16px; font-weight: 800;">${this.minimizeCount}</span> / 3
              </p>
            </div>
            <p style="font-size: 13px; color: #9ca3af; line-height: 1.5; margin: 0;">
              ${reason}<br/>Please return to the test screen immediately. All departures are logged.
            </p>
          </div>
        `;
      }
      this.overlayEl.style.display = 'flex';
    }
    if (this.onBlackout) {
      this.onBlackout(reason);
    }
  }

  /**
   * Hides the black screen overlay when focus is restored.
   */
  public hideBlackout(): void {
    if (this.isDisqualified || this.minimizeCount >= 3) {
      return;
    }
    if (this.overlayEl) {
      this.overlayEl.style.display = 'none';
    }
    if (this.onRestore) {
      this.onRestore();
    }
  }

  /**
   * Retrieves the current auth token for API calls
   */
  private resolveToken(): string | null {
    if (this.getAuthToken) {
      return this.getAuthToken();
    }
    if (typeof window !== 'undefined') {
      try {
        return (
          localStorage.getItem('jivanaut_session_token') ||
          sessionStorage.getItem('jivanaut_session_token') ||
          null
        );
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Dispatches the violation event to the backend API.
   */
  private async dispatchViolation(
    violationType: ViolationType,
    durationSeconds?: number,
    details?: string,
  ): Promise<void> {
    const questionNumber = this.getActiveQuestionNumber ? this.getActiveQuestionNumber() : undefined;

    // Track minimize / app-switch locally as well to safeguard against network dropouts
    if (violationType === 'MINIMIZE' || violationType === 'APP_SWITCH') {
      this.minimizeCount += 1;
      if (this.minimizeCount >= 3) {
        this.isDisqualified = true;
      }
    }

    try {
      if (this.apiBaseUrl && this.testId && this.testId !== 'preview') {
        const url = `${this.apiBaseUrl}/api/student/tests/${encodeURIComponent(this.testId)}/violations`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        const token = this.resolveToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            violationType,
            durationSeconds: durationSeconds ? Math.round(durationSeconds) : undefined,
            questionNumber,
            details,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const serverCount = data.data?.minimizeCount;
          if (typeof serverCount === 'number') {
            this.minimizeCount = serverCount;
          }
          if (data.data?.disqualified || this.minimizeCount >= 3) {
            this.isDisqualified = true;
            this.showBlackout('Exam terminated due to 3 screen switch violations.');
          } else {
            const countEl = document.getElementById('proctor-strike-count');
            if (countEl) {
              countEl.textContent = String(this.minimizeCount);
            }
          }
        }
      }
    } catch {
      // Offline or network error during dispatch; fail gracefully without crashing
    }

    if (this.isDisqualified || this.minimizeCount >= 3) {
      this.showBlackout('Exam terminated due to 3 screen switch violations.');
    } else {
      const countEl = document.getElementById('proctor-strike-count');
      if (countEl) {
        countEl.textContent = String(this.minimizeCount);
      }
    }

    if (this.onViolation) {
      this.onViolation({
        type: violationType,
        durationSeconds,
        questionNumber,
        minimizeCount: this.minimizeCount,
        disqualified: this.isDisqualified,
        score: this.isDisqualified ? 0 : undefined,
      });
    }
  }

  /**
   * Intercepts Windows & macOS screenshot, print, and DevTools shortcuts.
   */
  private attachKeyboardListeners(): void {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // 1. Windows PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        this.clearClipboard();
        this.showBlackout('Screenshot capture key (PrintScreen) detected.');
        this.dispatchViolation('CAPTURE_SHORTCUT', undefined, 'PrintScreen pressed');
        return;
      }

      // 2. Windows Snipping Tool (Win + Shift + S)
      if (e.shiftKey && (e.metaKey || e.ctrlKey) && key === 's') {
        e.preventDefault();
        this.clearClipboard();
        this.showBlackout('Screen snipping tool shortcut detected.');
        this.dispatchViolation('CAPTURE_SHORTCUT', undefined, 'Snipping tool shortcut');
        return;
      }

      // 3. macOS Screenshot Shortcuts: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(key)) {
        e.preventDefault();
        this.clearClipboard();
        this.showBlackout('macOS screenshot shortcut detected.');
        this.dispatchViolation('CAPTURE_SHORTCUT', undefined, `macOS Cmd+Shift+${key}`);
        return;
      }

      // 4. Print shortcuts: Ctrl+P or Cmd+P
      if (isCmdOrCtrl && key === 'p') {
        e.preventDefault();
        this.showBlackout('Printing or saving test content is prohibited.');
        this.dispatchViolation('CAPTURE_SHORTCUT', undefined, 'Print shortcut');
        return;
      }

      // 5. Developer Tools: F12 or Ctrl+Shift+I / Cmd+Opt+I
      if (e.key === 'F12' || (isCmdOrCtrl && e.shiftKey && key === 'i') || (e.metaKey && e.altKey && key === 'i')) {
        e.preventDefault();
        this.showBlackout('Developer tools inspection is prohibited.');
        this.dispatchViolation('OTHER', undefined, 'DevTools shortcut attempted');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    this.cleanupFns.push(() => window.removeEventListener('keydown', handleKeyDown, true));
  }

  /**
   * Flushes the system clipboard to prevent pasting captured content.
   */
  private clearClipboard(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText('').catch(() => {
        // clipboard write permission may be blocked
      });
    }
  }

  /**
   * Detects window blur, app switching, tab switches, and mobile notification pulldowns.
   */
  private attachFocusAndVisibilityListeners(): void {
    let focusLost = false;

    const handleFocusLoss = (reason: string) => {
      if (focusLost) return;
      focusLost = true;
      this.blurTimestamp = Date.now();
      this.showBlackout(`Test focus lost (${reason}). Return to resume.`);
    };

    const handleFocusGain = () => {
      if (!focusLost) return;
      focusLost = false;
      const durationSeconds = this.blurTimestamp
        ? (Date.now() - this.blurTimestamp) / 1000
        : undefined;
      this.blurTimestamp = null;
      this.hideBlackout();
      this.dispatchViolation('MINIMIZE', durationSeconds, 'Window minimized or tab switched');
    };

    // Window blur & focus
    // Guards against false positives when clicking inside the page (e.g. submit buttons, inputs)
    const onBlur = () => {
      if (typeof document !== 'undefined' && typeof document.hasFocus === 'function' && document.hasFocus()) {
        return;
      }
      handleFocusLoss('Window minimized or lost focus');
    };

    const onFocusOut = (e: FocusEvent) => {
      if (e.relatedTarget && typeof document !== 'undefined' && document.contains && document.contains(e.relatedTarget as Node)) {
        return;
      }
      if (typeof document !== 'undefined' && typeof document.hasFocus === 'function' && document.hasFocus()) {
        return;
      }
      handleFocusLoss('Window minimized or lost focus');
    };

    const onFocus = () => handleFocusGain();

    // Visibility change (tab switch, minimize, mobile app-switcher)
    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        handleFocusLoss('Tab switched or minimized');
      } else {
        handleFocusGain();
      }
    };

    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pagehide', onBlur);
    window.addEventListener('focusout', onFocusOut);
    document.addEventListener('visibilitychange', onVisibilityChange);

    this.cleanupFns.push(() => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pagehide', onBlur);
      window.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    });
  }

  /**
   * Tracks fullscreen state and triggers blackout if exited.
   */
  private attachFullscreenListeners(): void {
    const onFullscreenChange = () => {
      const isFullscreen = Boolean(
        document.fullscreenElement || (document as any).webkitFullscreenElement,
      );
      if (!isFullscreen) {
        this.showBlackout('Fullscreen mode was exited. Please re-enter fullscreen.');
        this.dispatchViolation('FULLSCREEN_EXIT', undefined, 'Fullscreen exited');
      } else {
        this.hideBlackout();
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    this.cleanupFns.push(() => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    });
  }

  /**
   * Blocks right-click context menu and drag-select copying.
   */
  private attachContextMenuAndSelectListeners(): void {
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', onContextMenu);
    this.cleanupFns.push(() => document.removeEventListener('contextmenu', onContextMenu));
  }

  /**
   * Initializes and maintains a tamper-resistant forensic watermark canvas over the viewport.
   */
  private ensureForensicWatermark(): void {
    if (typeof document === 'undefined') return;

    const setupCanvas = () => {
      let canvas = document.getElementById(this.watermarkElementId) as HTMLCanvasElement | null;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = this.watermarkElementId;
        document.body.appendChild(canvas);
      }

      canvas.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        pointer-events: none !important;
        z-index: 999998 !important;
        opacity: ${this.watermarkOpacity} !important;
        display: block !important;
        visibility: visible !important;
      `;

      this.watermarkCanvas = canvas;
      this.drawWatermarkPattern();
    };

    setupCanvas();

    // Resize listener to re-scale canvas
    const handleResize = () => {
      if (this.watermarkCanvas) {
        this.drawWatermarkPattern();
      }
    };
    window.addEventListener('resize', handleResize);
    this.cleanupFns.push(() => window.removeEventListener('resize', handleResize));

    // Periodic timestamp updater (every 30 seconds)
    this.watermarkTimer = setInterval(() => {
      if (this.watermarkCanvas && this.isRunning) {
        this.drawWatermarkPattern();
      }
    }, 30000);

    // MutationObserver to prevent student from deleting or styling away the watermark
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        if (!this.isRunning) return;

        let tampered = false;
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            for (const removedNode of Array.from(mutation.removedNodes)) {
              if (
                removedNode === this.watermarkCanvas ||
                (removedNode as HTMLElement).id === this.watermarkElementId
              ) {
                tampered = true;
              }
            }
          } else if (
            mutation.type === 'attributes' &&
            mutation.target === this.watermarkCanvas
          ) {
            const style = window.getComputedStyle(this.watermarkCanvas);
            if (
              style.display === 'none' ||
              style.visibility === 'hidden' ||
              parseFloat(style.opacity || '1') < this.watermarkOpacity * 0.5
            ) {
              tampered = true;
            }
          }
        }

        if (tampered) {
          this.showBlackout('Security watermark tampering detected.');
          this.dispatchViolation('OTHER', undefined, 'Watermark element modified or removed');
          setupCanvas();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'hidden'],
      });

      this.watermarkObserver = observer;
    }
  }

  /**
   * Draws repetitive angled text containing student identifier, test ID, and live UTC timestamp.
   */
  private drawWatermarkPattern(): void {
    if (!this.watermarkCanvas || typeof window === 'undefined') return;

    const canvas = this.watermarkCanvas;
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const studentTag =
      this.studentInfo?.studentEmail ||
      this.studentInfo?.studentName ||
      this.studentInfo?.studentId ||
      'STUDENT_SESSION';

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const text = `${studentTag}  •  TEST #${this.testId}  •  ${now} UTC`;

    ctx.font = '500 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';

    const stepX = 320;
    const stepY = 160;

    ctx.save();
    ctx.rotate((-25 * Math.PI) / 180);

    for (let x = -width; x < width * 2; x += stepX) {
      for (let y = -height; y < height * 2; y += stepY) {
        ctx.fillText(text, x, y);
      }
    }
    ctx.restore();
  }

  /**
   * Intercepts media device screen capture APIs and browser print events.
   */
  private attachMediaCaptureProtection(): void {
    if (typeof window === 'undefined') return;

    // 1. Intercept Web Screen Capture API (navigator.mediaDevices.getDisplayMedia)
    if (navigator && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      (navigator.mediaDevices as any).getDisplayMedia = async (..._args: any[]) => {
        this.showBlackout('Screen sharing and browser recording are strictly prohibited.');
        this.dispatchViolation(
          'CAPTURE_SHORTCUT',
          undefined,
          'navigator.mediaDevices.getDisplayMedia triggered',
        );
        throw new Error('Screen capture is disabled by exam security policy.');
      };

      this.cleanupFns.push(() => {
        (navigator.mediaDevices as any).getDisplayMedia = originalGetDisplayMedia;
      });
    }

    // 2. Intercept window.beforeprint
    const handleBeforePrint = () => {
      this.showBlackout('Printing or saving test content is prohibited.');
      this.dispatchViolation('CAPTURE_SHORTCUT', undefined, 'Browser print dialog opened');
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    this.cleanupFns.push(() => window.removeEventListener('beforeprint', handleBeforePrint));
  }

  /**
   * Detects mobile multi-touch screenshot gestures (e.g. 3-finger swipe) and suppresses touch callouts.
   */
  private attachMobileGestureAndTouchListeners(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // 1. Detect multi-touch screenshot gestures (2 or more simultaneous touch points)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        this.showBlackout('Multi-touch gesture or screenshot attempt detected.');
        this.dispatchViolation('CAPTURE_SHORTCUT', undefined, 'Multi-touch gesture detected');
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true } as any);
    this.cleanupFns.push(() => window.removeEventListener('touchstart', handleTouchStart as any));

    // 2. Inject global CSS preventing text selection, image dragging, and touch callouts (Google Lens)
    let styleEl = document.getElementById('proctor-security-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'proctor-security-styles';
      styleEl.textContent = `
        body, html {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          user-select: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
        img {
          pointer-events: none !important;
          -webkit-user-drag: none !important;
        }
      `;
      if (document.head) {
        document.head.appendChild(styleEl);
      }
    }
    this.cleanupFns.push(() => {
      if (styleEl && styleEl.parentElement) {
        styleEl.parentElement.removeChild(styleEl);
      }
    });
  }
}
