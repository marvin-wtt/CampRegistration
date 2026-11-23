/**
 * An event's form as SurveyJS serializes it (`Event.form`). Kept opaque on
 * purpose: forms are read through a `SurveyModel` or the guarded walkers in
 * `common/form`, which handle any JSON a manager can save, never by a shape
 * declared here.
 */
export type FormJson = Record<string, unknown>;
