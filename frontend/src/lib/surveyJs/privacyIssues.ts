import type { SurveyCreatorModel } from 'survey-creator-core';
import { type Question, QuestionMatrixDropdownModelBase } from 'survey-core';
import {
  formPrivacyIssues,
  privacyIssueKind,
  type FormPrivacyIssueKind,
  type FormPrivacyIssues,
} from '@camp-registration/common/form';
import type { ComposedPrivacyNotice } from '@camp-registration/common/privacy';
import {
  consentQuestionJson,
  type ConsentQuestionTexts,
} from './consentQuestion';

/** Why a question keeps the event from taking registrations. */
export interface QuestionPrivacyIssue {
  kind: FormPrivacyIssueKind;
  category: string;
  /** The matrix column carrying the tag, when it is not the question's own. */
  column?: string;
}

export interface PrivacyIssueOptions {
  message: (issue: QuestionPrivacyIssue) => string;
  action: (kind: FormPrivacyIssueKind) => string;
  /** The wording of a consent question covering one category. */
  consentTexts: (category: string) => ConsentQuestionTexts;
  openPrivacySettings: () => void;
}

// Runtime only, so it never reaches the saved form. A model property rather
// than a side table: the message panel redraws when it changes.
const ISSUE_PROPERTY = 'privacyIssue';

function setIssue(question: Question, issue: QuestionPrivacyIssue | null) {
  question.setPropertyValue(ISSUE_PROPERTY, issue);
  question.setPropertyValue('isMessagePanelVisible', issue !== null);
}

function issueOf(question: Question): QuestionPrivacyIssue | null {
  return (
    (question.getPropertyValue(
      ISSUE_PROPERTY,
    ) as QuestionPrivacyIssue | null) ?? null
  );
}

function issueFor(
  category: unknown,
  issues: FormPrivacyIssues,
): QuestionPrivacyIssue | null {
  if (typeof category !== 'string') {
    return null;
  }
  const kind = privacyIssueKind(category, issues);
  return kind ? { kind, category } : null;
}

/**
 * The issue a question raises: by its own tag, or for a matrix by its first
 * column raising one, as a column has no box of its own to show it in.
 */
function questionPrivacyIssue(
  question: Question,
  issues: FormPrivacyIssues,
): QuestionPrivacyIssue | null {
  const own = issueFor(question.getPropertyValue('privacyCategory'), issues);
  if (own || !(question instanceof QuestionMatrixDropdownModelBase)) {
    return own;
  }

  for (const column of question.columns) {
    // Off the JSON, where the form check reads column tags too.
    const issue = issueFor(column.toJSON().privacyCategory, issues);
    if (issue) {
      return { ...issue, column: column.title || column.name };
    }
  }
  return null;
}

/**
 * Marks every question that keeps the event from taking registrations
 * (docs/privacy.md, 5) with a message panel on the design surface, linking to
 * the fix: the privacy settings, or a consent question for its category.
 * Marks are recomputed on `refresh()`, which the editor calls after each save.
 */
export function attachPrivacyIssues(
  creator: SurveyCreatorModel,
  options: PrivacyIssueOptions,
) {
  // Undefined until the published notice is known: nothing to compare yet.
  let notice: ComposedPrivacyNotice | null | undefined;

  function refresh() {
    if (notice === undefined) {
      return;
    }
    const issues = formPrivacyIssues(creator.JSON, notice);
    // Dynamic panel templates too: their questions have boxes of their own.
    for (const question of creator.survey.getAllQuestions(false, true, true)) {
      setIssue(question, questionPrivacyIssue(question, issues));
    }
  }

  // One category per consent: unrelated purposes are never asked together.
  function addConsentQuestion(category: string) {
    const page = creator.survey.pages.at(-1);
    if (!page) {
      return;
    }
    const json = consentQuestionJson(
      creator.survey,
      [category],
      options.consentTexts(category),
    );
    const question = page.addNewQuestion('boolean', json.name);
    question.fromJSON(json);
    creator.selectElement(question);
    refresh();
  }

  creator.onCreateCustomMessagePanel.add((_, panel) => {
    const issue = issueOf(panel.question);
    if (!issue) {
      return;
    }
    panel.messageText = options.message(issue);
    panel.actionText = options.action(issue.kind);
    panel.onClick =
      issue.kind === 'uncovered'
        ? () => addConsentQuestion(issue.category)
        : options.openPrivacySettings;
  });

  return {
    setNotice(published: ComposedPrivacyNotice | null) {
      notice = published;
      refresh();
    },
    refresh,
  };
}
