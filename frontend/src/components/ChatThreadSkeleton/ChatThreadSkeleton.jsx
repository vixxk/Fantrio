import styles from './ChatThreadSkeleton.module.css';

/**
 * ChatThreadSkeleton — skeleton bubbles for a chat thread.
 * Alternates fan (left, with avatar) / creator (right) bubbles to mimic a
 * real conversation while messages are loading.
 *
 * @param {boolean} light — light theme variant (app dark theme is default)
 */
export const ChatThreadSkeleton = ({ light = false }) => {
  const rows = [0, 1, 2, 3, 4, 5, 6];
  return (
    <div className={`${styles.thread} ${light ? styles.light : ''}`} aria-hidden="true">
      <div className={styles.dateWrap}>
        <span className={`${styles.datePill} ${styles.sk}`} />
      </div>
      {rows.map((i) => {
        const isLeft = i % 2 === 0;
        return (
          <div key={i} className={`${styles.row} ${isLeft ? styles.rowLeft : styles.rowRight}`}>
            {isLeft && <span className={`${styles.avatar} ${styles.sk}`} />}
            <div className={`${styles.bubble} ${isLeft ? styles.bubbleLeft : styles.bubbleRight}`}>
              <span className={`${styles.line} ${styles.sk}`} style={{ width: isLeft ? '78%' : '64%' }} />
              <span className={`${styles.line} ${styles.sk}`} style={{ width: isLeft ? '54%' : '42%' }} />
              {i % 3 === 0 && (
                <span className={`${styles.line} ${styles.sk}`} style={{ width: isLeft ? '34%' : '28%' }} />
              )}
              <span className={`${styles.time} ${styles.sk}`} style={{ width: isLeft ? '34%' : '30%' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * ChatScreenSkeleton — full chat screen skeleton (header + thread + input).
 * Used when navigating directly to /messages/:id before the conversation
 * payload has arrived.
 *
 * @param {boolean} light — light theme variant
 */
export const ChatScreenSkeleton = ({ light = false }) => (
  <div className={`${styles.screen} ${light ? styles.light : ''}`} aria-hidden="true">
    <div className={styles.header}>
      <span className={`${styles.headerAvatar} ${styles.sk}`} />
      <div className={styles.headerLines}>
        <span className={`${styles.headerName} ${styles.sk}`} />
        <span className={`${styles.headerStatus} ${styles.sk}`} />
      </div>
      <div className={styles.headerActions}>
        <span className={`${styles.headerBtn} ${styles.sk}`} />
        <span className={`${styles.headerBtn} ${styles.sk}`} />
      </div>
    </div>
    <ChatThreadSkeleton light={light} />
    <div className={styles.inputBar}>
      <span className={`${styles.inputField} ${styles.sk}`} />
      <span className={`${styles.sendBtn} ${styles.sk}`} />
    </div>
  </div>
);
