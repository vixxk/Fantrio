import { Check, CheckCheck } from 'lucide-react';
import styles from './ReadReceipt.module.css';

/**
 * Tiny read-receipt indicator shown next to the timestamp on the sender's own
 * message bubbles: a single check means the message was delivered but not yet
 * read; a double check (accent colored) means the recipient has opened it.
 *
 * Props:
 *  - read  (bool) whether the recipient has read the message
 *  - size  (number) icon size in px
 */
export const ReadReceipt = ({ read = false, size = 13 }) => (
  <span
    className={`${styles.receipt} ${read ? styles.read : styles.sent}`}
    title={read ? 'Read' : 'Sent'}
    aria-label={read ? 'Read' : 'Sent'}
  >
    {read ? <CheckCheck size={size} strokeWidth={2.5} /> : <Check size={size} strokeWidth={2.5} />}
  </span>
);

export default ReadReceipt;
