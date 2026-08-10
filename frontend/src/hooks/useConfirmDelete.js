import { useState, useCallback } from 'react';
import { useToast } from '../components/Toast/Toast';

/**
 * useConfirmDelete — shared state machine for confirmation dialogs.
 *
 * Handles the open/close/deleting state plus the async confirm action with
 * non-blocking toast feedback, so pages only provide the API call and messages.
 *
 * @param {object} options
 * @param {(target: any) => Promise<any>} options.onConfirm   async action; response used for status check
 * @param {string | ((target: any) => string)} [options.successMessage]
 * @param {string | ((target: any) => string)} [options.errorMessage]
 * @param {(target: any, res?: any) => void} [options.onSuccess]  runs after success with the response (reload, navigate, etc.)
 * @returns {{ target, setTarget, open, close, confirm, deleting }}
 */
export const useConfirmDelete = ({
  onConfirm,
  successMessage = 'Deleted successfully',
  errorMessage = 'Failed to delete. Please try again.',
  onSuccess,
}) => {
  const { toast } = useToast();
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const open = useCallback((item) => setTarget(item), []);
  const close = useCallback(() => setTarget(null), []);

  const confirm = useCallback(async () => {
    if (!target) return;
    setDeleting(true);
    try {
      const res = await onConfirm(target);
      const ok = !res || res.status === undefined || res.status === 'success';
      close();
      if (ok) {
        toast.success(typeof successMessage === 'function' ? successMessage(target) : successMessage);
        onSuccess?.(target, res);
      } else {
        toast.error(res.message || (typeof errorMessage === 'function' ? errorMessage(target) : errorMessage));
      }
    } catch (err) {
      console.error('Confirm action failed:', err);
      close();
      toast.error(err.message || (typeof errorMessage === 'function' ? errorMessage(target) : errorMessage));
    } finally {
      setDeleting(false);
    }
  }, [target, onConfirm, successMessage, errorMessage, onSuccess, toast, close]);

  return { target, setTarget, open, close, confirm, deleting };
};

export default useConfirmDelete;
