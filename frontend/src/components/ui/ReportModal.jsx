import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { submitReportRequest } from '../../services/reportService.js';
import { Textarea } from './Textarea.jsx';
import { Select } from './Select.jsx';
import { Button } from './Button.jsx';

const REASONS = [
  { value: 'spam', label: 'Spam or Misleading' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'harassment', label: 'Harassment or Abuse' },
  { value: 'fake_activity', label: 'Fake/Scam Activity' },
  { value: 'no_show', label: 'No-Show / Unreliability' },
  { value: 'other', label: 'Other' },
];

export default function ReportModal({ isOpen, onClose, targetType, targetId, targetName, targetUserId, onSubmitSuccess }) {
  const [reason, setReason] = useState(REASONS[0].value);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        targetType,
        targetUser: targetUserId,
        reason,
        description,
      };
      if (targetType === 'activity') {
        payload.targetActivity = targetId;
      }

      await submitReportRequest(payload);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDescription('');
        setReason(REASONS[0].value);
        onClose();
        if (onSubmitSuccess) onSubmitSuccess();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-lifted border border-ink-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
          <div className="flex items-center gap-2 text-red-650">
            <AlertTriangle className="h-4.5 w-4.5" />
            <h3 className="text-base font-bold text-ink-900">Report {targetType === 'activity' ? 'Activity' : 'Member'}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-all"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        {success ? (
          <div className="p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-3">
              ✓
            </div>
            <h4 className="text-sm font-bold text-ink-800 mb-1">Report Submitted</h4>
            <p className="text-xs text-ink-400">Thank you. The moderation team has been notified.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            <p className="text-xs text-ink-500">
              You are flagging <strong className="text-ink-700">{targetName}</strong>. Please provide details below.
            </p>

            <Select
              id="report-reason"
              label="Reason for reporting"
              options={REASONS}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <Textarea
              id="report-description"
              label="Additional details"
              placeholder="Please describe why this should be moderated…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Submit Report
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
