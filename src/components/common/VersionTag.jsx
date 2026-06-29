// =============================================================================
// VersionTag — versão do app no rodapé + override manual de cache (discreto)
// =============================================================================
// O re-download forçado SÓ dispara com um gesto deliberado, pra não acontecer
// sem querer:
//   - Desktop: segurar ALT e clicar.
//   - Mobile:  long-press (~700ms).
// -----------------------------------------------------------------------------

import { useRef, useState } from 'react';
import { APP_VERSION } from '../../version';
import styles from './VersionTag.module.css';

const LONG_PRESS_MS = 700;

export default function VersionTag({ onForceUpdate }) {
  const [armed, setArmed] = useState(false); // feedback visual rápido
  const timerRef = useRef(null);
  const firedRef = useRef(false);

  const trigger = () => {
    setArmed(true);
    setTimeout(() => setArmed(false), 600);
    onForceUpdate?.();
  };

  // ---- Desktop: ALT + click ----
  const handleClick = (e) => {
    if (firedRef.current) {
      // veio de um long-press que já disparou; ignora o click sintético
      firedRef.current = false;
      return;
    }
    if (e.altKey) {
      e.preventDefault();
      trigger();
    }
  };

  // ---- Mobile: long press ----
  const startPress = () => {
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      trigger();
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <button
      type="button"
      className={`${styles.tag} ${armed ? styles.armed : ''}`}
      onClick={handleClick}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchCancel={cancelPress}
      onContextMenu={(e) => e.preventDefault()} // evita menu no long-press
      title="ALT+click (or long-press on mobile) to force a data update"
      aria-label={`Version ${APP_VERSION}`}
    >
      {armed ? 'updating…' : APP_VERSION}
    </button>
  );
}
