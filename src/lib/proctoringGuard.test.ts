import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ProctoringGuard } from './proctoringGuard';

describe('ProctoringGuard Frontend Integrity & Black-Screen Security Tests', () => {
  it('instantiates correctly with default options and watermark disabled', () => {
    const guard = new ProctoringGuard({
      testId: 'test-unit-001',
    });

    expect(guard).toBeDefined();
    expect(guard.getMinimizeCount()).toBe(0);
    expect(guard.getIsDisqualified()).toBe(false);
  });

  describe('Browser simulation environment', () => {
    let mockWindow: any;
    let mockDocument: any;
    let mockListeners: Record<string, Function[]> = {};

    beforeEach(() => {
      mockListeners = {};

      const createdElements: any[] = [];
      const createElement = (tag: string) => {
        const el: any = {
          tagName: tag.toUpperCase(),
          id: '',
          style: {
            cssText: '',
            display: '',
          },
          innerHTML: '',
          textContent: '',
          parentElement: null,
          appendChild: vi.fn(),
          removeChild: vi.fn((child: any) => {
            child.parentElement = null;
          }),
          getContext: vi.fn(() => ({
            scale: vi.fn(),
            clearRect: vi.fn(),
            save: vi.fn(),
            rotate: vi.fn(),
            fillText: vi.fn(),
            restore: vi.fn(),
          })),
        };
        createdElements.push(el);
        return el;
      };

      const bodyEl = createElement('body');
      const headEl = createElement('head');

      mockDocument = {
        hidden: false,
        hasFocus: vi.fn(() => false),
        contains: vi.fn(() => false),
        getElementById: vi.fn((id: string) => {
          return createdElements.find((el) => el.id === id) || null;
        }),
        createElement: vi.fn((tag: string) => createElement(tag)),
        body: bodyEl,
        head: headEl,
        documentElement: {
          requestFullscreen: vi.fn(async () => {}),
        },
        addEventListener: vi.fn((event: string, handler: Function) => {
          mockListeners[event] = mockListeners[event] || [];
          mockListeners[event].push(handler);
        }),
        removeEventListener: vi.fn((event: string, handler: Function) => {
          if (mockListeners[event]) {
            mockListeners[event] = mockListeners[event].filter((h) => h !== handler);
          }
        }),
      };

      bodyEl.appendChild = vi.fn((el: any) => {
        el.parentElement = bodyEl;
        return el;
      });
      bodyEl.removeChild = vi.fn((el: any) => {
        el.parentElement = null;
        return el;
      });
      headEl.appendChild = vi.fn((el: any) => {
        el.parentElement = headEl;
        return el;
      });
      headEl.removeChild = vi.fn((el: any) => {
        el.parentElement = null;
        return el;
      });

      mockWindow = {
        innerWidth: 1920,
        innerHeight: 1080,
        devicePixelRatio: 2,
        screen: {
          availHeight: 1080,
          availWidth: 1920,
          height: 1080,
          width: 1920,
        },
        addEventListener: vi.fn((event: string, handler: Function) => {
          mockListeners[event] = mockListeners[event] || [];
          mockListeners[event].push(handler);
        }),
        removeEventListener: vi.fn((event: string, handler: Function) => {
          if (mockListeners[event]) {
            mockListeners[event] = mockListeners[event].filter((h) => h !== handler);
          }
        }),
        getComputedStyle: vi.fn(() => ({
          display: 'block',
          visibility: 'visible',
          opacity: '0.12',
        })),
      };

      (global as any).window = mockWindow;
      (global as any).document = mockDocument;
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Linux; Android 14; Mobile; Chrome/120.0)',
          clipboard: { writeText: vi.fn(async () => {}) },
          mediaDevices: { getDisplayMedia: vi.fn(async () => ({} as any)) },
        },
        configurable: true,
        writable: true,
      });

      // Mock fetch
      (global as any).fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            minimizeCount: 1,
            disqualified: false,
          },
        }),
      }));
    });

    afterEach(() => {
      delete (global as any).window;
      delete (global as any).document;
      delete (global as any).fetch;
    });

    it('enforces pure black screen (#000000) on overlay and disables watermark by default', () => {
      const guard = new ProctoringGuard({
        testId: 'test-101',
      });
      guard.start();

      const overlay = mockDocument.getElementById('proctor-blackout-overlay');
      expect(overlay).toBeDefined();
      expect(overlay.style.cssText).toContain('background-color: #000000 !important');
      expect(overlay.style.cssText).toContain('z-index: 2147483647 !important');

      // Watermark canvas should NOT be created
      const watermark = mockDocument.getElementById('proctor-forensic-watermark');
      expect(watermark).toBeNull();

      guard.stop();
    });

    it('suppresses mobile text selection, image dragging, and Chrome Google Lens callouts', () => {
      const guard = new ProctoringGuard({
        testId: 'test-styles-001',
      });
      guard.start();

      const styleEl = mockDocument.getElementById('proctor-security-styles');
      expect(styleEl).toBeDefined();
      expect(styleEl.textContent).toContain('-webkit-touch-callout: none !important');
      expect(styleEl.textContent).toContain('-webkit-user-select: none !important');
      expect(styleEl.textContent).toContain('-webkit-user-drag: none !important');

      guard.stop();
      expect(styleEl.parentElement).toBeNull();
    });

    it('triggers instant black screen when mobile multi-touch gesture is detected', () => {
      const blackoutSpy = vi.fn();
      const violationSpy = vi.fn();

      const guard = new ProctoringGuard({
        testId: 'test-touch-001',
        onBlackout: blackoutSpy,
        onViolation: violationSpy,
      });
      guard.start();

      const touchHandlers = mockListeners['touchstart'] || [];
      expect(touchHandlers.length).toBeGreaterThan(0);

      // Simulate 3-finger screenshot gesture
      const multiTouchEvent = {
        touches: [
          { clientX: 100, clientY: 200 },
          { clientX: 150, clientY: 250 },
          { clientX: 200, clientY: 300 },
        ],
      };

      touchHandlers[0]!(multiTouchEvent);

      expect(blackoutSpy).toHaveBeenCalledWith(expect.stringContaining('Multi-touch gesture'));
      const overlay = mockDocument.getElementById('proctor-blackout-overlay');
      expect(overlay.style.display).toBe('flex');

      guard.stop();
    });

    it('shows prominent security warning alert on blur, focusout, pagehide, and visibilitychange', () => {
      const blackoutSpy = vi.fn();
      const guard = new ProctoringGuard({
        testId: 'test-blur-001',
        onBlackout: blackoutSpy,
      });
      guard.start();

      const blurHandlers = mockListeners['blur'] || [];
      expect(blurHandlers.length).toBeGreaterThan(0);

      // Trigger blur
      blurHandlers[0]!();

      expect(blackoutSpy).toHaveBeenCalled();
      const overlay = mockDocument.getElementById('proctor-blackout-overlay');
      expect(overlay.innerHTML).toContain('SECURITY ALERT: SCREEN HIDDEN');
      expect(overlay.innerHTML).toContain('STRIKE WARNING: 3 screen switches will automatically terminate your exam with 0 MARKS');
      expect(overlay.innerHTML).toContain('Current Screen Switches: <span id="proctor-strike-count"');

      guard.stop();
    });

    it('permanently locks screen to EXAM TERMINATED - SCORE: 0 MARKS on 3 screen switches', async () => {
      const violationSpy = vi.fn();
      const guard = new ProctoringGuard({
        testId: 'test-terminate-001',
        apiBaseUrl: 'https://backend-jivant.onrender.com',
        onViolation: violationSpy,
      });
      guard.start();

      // Mock 3rd switch response from backend
      (global as any).fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            minimizeCount: 3,
            disqualified: true,
            score: 0,
            message: 'Exam terminated and marked with 0 marks due to exceeding 3 screen switch violations.',
          },
        }),
      }));

      const blurHandlers = mockListeners['blur'] || [];
      const focusHandlers = mockListeners['focus'] || [];

      // Switch 1: Blur and focus gain
      blurHandlers[0]!();
      await focusHandlers[0]!();

      // Force strike count to 3
      (guard as any).minimizeCount = 3;
      (guard as any).isDisqualified = true;

      // Trigger blackout after 3 strikes
      guard.showBlackout('Exam terminated due to 3 screen switch violations.');

      const overlay = mockDocument.getElementById('proctor-blackout-overlay');
      expect(overlay.innerHTML).toContain('EXAM TERMINATED');
      expect(overlay.innerHTML).toContain('SCORE: 0 MARKS');
      expect(overlay.innerHTML).toContain('You have exceeded the maximum limit of 3 screen switches');

      // Attempting hideBlackout MUST NOT hide the overlay
      guard.hideBlackout();
      expect(overlay.style.display).toBe('flex');
      expect(guard.getIsDisqualified()).toBe(true);

      guard.stop();
    });

    it('sends Authorization Bearer header when session token exists', async () => {
      const fetchSpy = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { minimizeCount: 1, disqualified: false },
        }),
      }));
      (global as any).fetch = fetchSpy;

      const guard = new ProctoringGuard({
        testId: 'test-auth-001',
        apiBaseUrl: 'https://backend-jivant.onrender.com',
        getAuthToken: () => 'my-jwt-session-token',
        getActiveQuestionNumber: () => 4,
      });
      guard.start();

      const blurHandlers = mockListeners['blur'] || [];
      const focusHandlers = mockListeners['focus'] || [];

      blurHandlers[0]!();
      await focusHandlers[0]!();

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://backend-jivant.onrender.com/api/student/tests/test-auth-001/violations',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-jwt-session-token',
            'Content-Type': 'application/json',
          }),
          credentials: 'include',
        }),
      );

      guard.stop();
    });

    it('does not trigger blackout when clicking buttons while document.hasFocus() is true', () => {
      mockDocument.hasFocus = vi.fn(() => true);
      const blackoutSpy = vi.fn();
      const guard = new ProctoringGuard({
        testId: 'test-submit-click-001',
        onBlackout: blackoutSpy,
      });
      guard.start();

      const blurHandlers = mockListeners['blur'] || [];
      const focusoutHandlers = mockListeners['focusout'] || [];

      // Simulate clicking submit button or option
      blurHandlers[0]!();
      focusoutHandlers[0]!({ relatedTarget: null });

      expect(blackoutSpy).not.toHaveBeenCalled();

      guard.stop();
    });

    it('counts Command (Meta), Control, and PrintScreen as screen switch strikes and disqualifies on 3 strikes', () => {
      const violationSpy = vi.fn();
      const guard = new ProctoringGuard({
        testId: 'test-key-strikes-001',
        onViolation: violationSpy,
      });
      guard.start();

      const keydownHandlers = mockListeners['keydown'] || [];
      const keyupHandlers = mockListeners['keyup'] || [];

      // Strike 1: Press Command (Meta) alone
      const mockEventCmd = {
        key: 'Meta',
        metaKey: true,
        ctrlKey: false,
        repeat: false,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };
      keydownHandlers[0]!(mockEventCmd);
      expect(guard.getMinimizeCount()).toBe(1);
      expect(mockEventCmd.preventDefault).toHaveBeenCalled();

      // Release Command key
      keyupHandlers[0]!({ key: 'Meta', metaKey: false, ctrlKey: false });

      // Fast-forward cooldown (1.1s)
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 1100);

      // Strike 2: Press Control alone
      const mockEventCtrl = {
        key: 'Control',
        metaKey: false,
        ctrlKey: true,
        repeat: false,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };
      keydownHandlers[0]!(mockEventCtrl);
      expect(guard.getMinimizeCount()).toBe(2);

      // Verify key repeat does NOT increment count
      const mockEventCtrlRepeat = {
        key: 'Control',
        metaKey: false,
        ctrlKey: true,
        repeat: true,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };
      keydownHandlers[0]!(mockEventCtrlRepeat);
      expect(guard.getMinimizeCount()).toBe(2); // Still 2 strikes!

      // Release Control key
      keyupHandlers[0]!({ key: 'Control', metaKey: false, ctrlKey: false });

      // Fast-forward cooldown (1.1s)
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 2500);

      // Strike 3: Press PrintScreen
      const mockEventPrtScn = {
        key: 'PrintScreen',
        metaKey: false,
        ctrlKey: false,
        repeat: false,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };
      keydownHandlers[0]!(mockEventPrtScn);
      expect(guard.getMinimizeCount()).toBe(3);
      expect(guard.getIsDisqualified()).toBe(true);

      const overlay = mockDocument.getElementById('proctor-blackout-overlay');
      expect(overlay.innerHTML).toContain('EXAM TERMINATED');
      expect(overlay.innerHTML).toContain('SCORE: 0 MARKS');

      guard.stop();
    });

    it('records strike on top notification shade pulldown and app switch', () => {
      const guard = new ProctoringGuard({ testId: 'test-mobile-shade-001' });
      guard.start();

      const blurHandlers = mockListeners['blur'] || [];
      const visibilityHandlers = mockListeners['visibilitychange'] || [];

      // Pulldown top notification bar (triggers blur without hidden initially)
      mockDocument.hasFocus = vi.fn(() => false);
      mockDocument.hidden = false;
      blurHandlers[0]!();

      expect(guard.getMinimizeCount()).toBe(1);
      const overlay = mockDocument.getElementById('proctor-blackout-overlay');
      expect(overlay.innerHTML).toContain('Top notification pulldown or window departure');

      // Fast-forward
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 2000);

      // Switch to another app like WhatsApp (triggers visibilitychange to hidden)
      mockDocument.hidden = true;
      visibilityHandlers[0]!();

      expect(guard.getMinimizeCount()).toBe(2);
      expect(overlay.innerHTML).toContain('App switch or home screen exit');

      guard.stop();
    });

    it('blocks 3-finger screenshot gesture and records a strike', () => {
      const guard = new ProctoringGuard({ testId: 'test-mobile-gesture-001' });
      guard.start();

      const touchstartHandlers = mockListeners['touchstart'] || [];
      const touchmoveHandlers = mockListeners['touchmove'] || [];

      const mock3FingerEvent = {
        touches: [{ clientX: 10 }, { clientX: 50 }, { clientX: 90 }],
        cancelable: true,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      // 3 fingers touch screen
      touchstartHandlers[0]!(mock3FingerEvent);
      expect(mock3FingerEvent.preventDefault).toHaveBeenCalled();
      expect(guard.getMinimizeCount()).toBe(1);

      // 3 fingers drag downward (touchmove)
      touchmoveHandlers[0]!(mock3FingerEvent);
      expect(mock3FingerEvent.preventDefault).toHaveBeenCalled();

      const overlay = mockDocument.getElementById('proctor-blackout-overlay');
      expect(overlay.innerHTML).toContain('3-finger screenshot gesture blocked');

      guard.stop();
    });

    it('detects split-screen mode and records strike, while allowing keyboard typing', () => {
      const guard = new ProctoringGuard({ testId: 'test-mobile-splitscreen-001' });
      guard.start();

      const resizeHandlers = mockListeners['resize'] || [];

      // 1. Normal resize with input element focused (virtual keyboard) -> NO STRIKE
      const mockInput = {
        tagName: 'INPUT',
        isContentEditable: false,
      };
      mockDocument.activeElement = mockInput;
      mockWindow.innerHeight = 450; // Dropped to 450 due to keyboard
      resizeHandlers[0]!();

      expect(guard.getMinimizeCount()).toBe(0);

      // 2. Split-screen resize with NO input focused -> STRIKE RECORDED
      mockDocument.activeElement = mockDocument.body;
      (guard as any).isKeyboardFocused = false;
      mockWindow.innerHeight = 450; // Half screen in split mode (450 / 1080 = 41% < 65%)
      resizeHandlers[0]!();

      expect(guard.getMinimizeCount()).toBe(1);
      const overlay = mockDocument.getElementById('proctor-blackout-overlay');
      expect(overlay.innerHTML).toContain('Split-screen / multi-window mode detected');

      guard.stop();
    });
  });
});
