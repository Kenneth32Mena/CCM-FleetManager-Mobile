import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export const DEFAULT_IDLE_TIMEOUT_MS = 60 * 60 * 1000;

let resetHandler = null;

// React Native no tiene mousemove/keydown: el contenedor raíz llama a esto
// desde onStartShouldSetResponderCapture para registrar actividad táctil.
export function reportActivity() {
  if (resetHandler) resetHandler();
}

export function useIdleTimeout(onTimeout, { timeoutMs = DEFAULT_IDLE_TIMEOUT_MS, enabled = true } = {}) {
  const callbackRef = useRef(onTimeout);

  useEffect(() => {
    callbackRef.current = onTimeout;
  });

  useEffect(() => {
    if (!enabled) {
      resetHandler = null;
      return undefined;
    }

    let timer = null;
    let lastActivity = Date.now();

    function fire() {
      clearTimeout(timer);
      timer = null;
      resetHandler = null;
      callbackRef.current();
    }

    function reset() {
      lastActivity = Date.now();
      clearTimeout(timer);
      timer = setTimeout(fire, timeoutMs);
    }

    resetHandler = reset;
    reset();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const elapsed = Date.now() - lastActivity;
      if (elapsed >= timeoutMs) {
        fire();
      } else {
        reset();
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
      resetHandler = null;
    };
  }, [timeoutMs, enabled]);
}
