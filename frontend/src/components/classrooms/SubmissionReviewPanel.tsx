'use client';

import { ClassroomPuzzleSubmission } from '@/lib/types';

interface Props {
  submission: ClassroomPuzzleSubmission;
}

export default function SubmissionReviewPanel({ submission }: Props) {
  if (!submission.reviewedAt) return null;

  return (
    <div className="space-y-4">
      {/* Submitted answer (read-only) */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Your Submitted Answer</p>
        <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">{submission.notation}</pre>
        {submission.notes && (
          <>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-3 mb-1">Your Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.notes}</p>
          </>
        )}
      </div>

      {/* Coach verdict */}
      <div
        className={`rounded-lg p-4 border ${
          submission.isCorrect
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-lg font-bold ${submission.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {submission.isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </span>
          <span className="text-xs text-gray-500">
            Reviewed {new Date(submission.reviewedAt).toLocaleDateString()}
          </span>
        </div>
        {submission.coachFeedback && (
          <>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Coach Feedback</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{submission.coachFeedback}</p>
          </>
        )}
      </div>
    </div>
  );
}
