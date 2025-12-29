export const YasumuScriptingLanguage = {
  JavaScript: 'javascript',
} as const;

export type YasumuScriptingLanguage =
  (typeof YasumuScriptingLanguage)[keyof typeof YasumuScriptingLanguage];
