export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Capitalized subjects ("feat: Add …") are common in this repo.
    'subject-case': [0],
    'header-max-length': [1, 'always', 120],
    // Dependabot bodies and footers contain long URLs.
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
};
