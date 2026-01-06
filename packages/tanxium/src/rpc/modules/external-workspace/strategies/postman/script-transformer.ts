import { YasumuEmbeddedScript, YasumuScriptingLanguage } from '@yasumu/common';
import { PostmanEvent } from './types.ts';

export class PostmanScriptTransformer {
  public extractScripts(events: PostmanEvent[] | undefined): {
    script: YasumuEmbeddedScript | null;
    testScript: YasumuEmbeddedScript | null;
  } {
    if (!events) return { script: null, testScript: null };

    const preRequestCode: string[] = [];
    const responseCode: string[] = [];
    const testCode: string[] = [];

    for (const event of events) {
      if (!event.script?.exec || event.script.exec.length === 0) continue;

      const rawCode = event.script.exec.join('\n');
      const convertedCode = this.convertPostmanScript(rawCode);

      if (event.listen === 'prerequest') {
        preRequestCode.push(convertedCode);
      } else {
        const { tests, pre } = this.extractCode(convertedCode);
        if (pre.length > 0) {
          responseCode.push(pre.join('\n'));
        }
        testCode.push(...tests);
      }
    }

    const blocks: string[] = [];
    const imports: string[] = [];

    if (preRequestCode.length) {
      blocks.push(
        `export function onRequest(req: YasumuRequest) {\n${this.indentCode(preRequestCode.join('\n'))}\n}`,
      );
    }

    if (responseCode.length) {
      blocks.push(
        `export function onResponse(req: YasumuRequest, res: YasumuResponse) {\n${this.indentCode(responseCode.join('\n'))}\n}`,
      );
    }

    if (testCode.length) {
      blocks.push(
        `export function onTest(req: YasumuRequest, res: YasumuResponse) {\n${this.indentCode(testCode.join('\n\n'))}\n}`,
      );
    }

    if (!blocks.length) return { script: null, testScript: null };

    const codeOutput = [...imports, '', ...blocks].join('\n\n').trim();

    const script: YasumuEmbeddedScript = {
      language: YasumuScriptingLanguage.JavaScript,
      code: codeOutput,
    };

    return { script, testScript: null };
  }

  private extractCode(code: string): { tests: string[]; pre: string[] } {
    const tests: string[] = [];
    const preLines: string[] = [];
    const lines = code.split('\n');

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const testMatch = line.match(/pm\.test\s*\(/);

      if (testMatch) {
        const testBlock = this.extractPmTestBlock(lines, i);
        tests.push(this.convertPmTestToYasumu(testBlock.code));
        i = testBlock.endIndex + 1;
      } else {
        preLines.push(line);
        i++;
      }
    }

    return { tests, pre: preLines.filter((l) => l.trim().length > 0) };
  }

  private extractPmTestBlock(
    lines: string[],
    startIndex: number,
  ): { code: string; endIndex: number } {
    let depth = 0;
    let started = false;
    let endIndex = startIndex;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];

      for (const char of line) {
        if (char === '(' || char === '{') {
          depth++;
          started = true;
        } else if (char === ')' || char === '}') {
          depth--;
        }
      }

      if (started && depth === 0) {
        endIndex = i;
        break;
      }
    }

    const block = lines.slice(startIndex, endIndex + 1).join('\n');
    return { code: block, endIndex };
  }

  private convertPmTestToYasumu(pmTestCode: string): string {
    const nameMatch = pmTestCode.match(/pm\.test\s*\(\s*(['"`])(.+?)\1/);
    const testName = nameMatch ? nameMatch[2] : 'Untitled test';

    const bodyMatch = pmTestCode.match(
      /pm\.test\s*\([^,]+,\s*(?:async\s*)?\(?.*?\)?\s*=>\s*\{([\s\S]*)\}\s*\)\s*;?\s*$/,
    );

    if (!bodyMatch) {
      const fnBodyMatch = pmTestCode.match(
        /pm\.test\s*\([^,]+,\s*function\s*\([^)]*\)\s*\{([\s\S]*)\}\s*\)\s*;?\s*$/,
      );
      const body = fnBodyMatch ? fnBodyMatch[1].trim() : '';
      return this.wrapInYasumuTest(testName, body);
    }

    return this.wrapInYasumuTest(testName, bodyMatch[1].trim());
  }

  private wrapInYasumuTest(name: string, body: string): string {
    const convertedBody = this.convertExpectations(body);
    const maybeAsync = [' async ', 'async '].some((s) =>
      convertedBody.includes(s),
    )
      ? 'async'
      : '';

    return `Deno.test(${JSON.stringify(name)}, ${maybeAsync}() => {\n${this.indentCode(convertedBody)}\n});`;
  }

  private convertExpectations(code: string): string {
    let result = code;

    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.eql\(([^)]+)\)/g,
      'expect($1).toEqual($2)',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.equal\(([^)]+)\)/g,
      'expect($1).toBe($2)',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.be\.true/g,
      'expect($1).toBe(true)',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.be\.false/g,
      'expect($1).toBe(false)',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.be\.null/g,
      'expect($1).toBeNull()',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.be\.undefined/g,
      'expect($1).toBeUndefined()',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.have\.property\(([^)]+)\)/g,
      'expect($1).toHaveProperty($2)',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.include\(([^)]+)\)/g,
      'expect($1).toContain($2)',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.have\.lengthOf\(([^)]+)\)/g,
      'expect($1).toHaveLength($2)',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.be\.above\(([^)]+)\)/g,
      'expect($1).toBeGreaterThan($2)',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.be\.below\(([^)]+)\)/g,
      'expect($1).toBeLessThan($2)',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.exist/g,
      'expect($1).toBeDefined()',
    );
    result = result.replace(
      /pm\.expect\(([^)]+)\)\.to\.be\.ok/g,
      'expect($1).toBeTruthy()',
    );
    result = result.replace(/pm\.expect\(([^)]+)\)\./g, 'expect($1).');
    result = result.replaceAll(
      'pm.response.to.have.status(',
      'expect(res.status).toBe(',
    );
    result = result.replaceAll(
      /pm\.response\.to\.have\.header\(([^)]+)\)/g,
      'expect(res.headers.get($1)).toBeDefined()',
    );

    return result;
  }

  private convertPostmanScript(code: string): string {
    let converted = code;

    converted = converted.replace(
      /pm\.environment\.get\(([^)]+)\)/g,
      'req.env.getSecret($1)',
    );
    converted = converted.replace(
      /pm\.environment\.set\(([^,]+),\s*([^)]+)\)/g,
      'req.env.setSecret($1, $2)',
    );
    converted = converted.replace(
      /pm\.variables\.get\(([^)]+)\)/g,
      'req.env.getVariable($1)',
    );
    converted = converted.replace(
      /pm\.variables\.set\(([^,]+),\s*([^)]+)\)/g,
      'req.env.setVariable($1, $2)',
    );
    converted = converted.replace(
      /pm\.globals\.get\(([^)]+)\)/g,
      'req.env.getVariable($1)',
    );
    converted = converted.replace(
      /pm\.globals\.set\(([^,]+),\s*([^)]+)\)/g,
      'req.env.setVariable($1, $2)',
    );
    converted = converted.replace(
      /pm\.collectionVariables\.get\(([^)]+)\)/g,
      'req.env.getVariable($1)',
    );
    converted = converted.replace(
      /pm\.collectionVariables\.set\(([^,]+),\s*([^)]+)\)/g,
      'req.env.setVariable($1, $2)',
    );

    converted = converted.replace(/pm\.request\.url/g, 'req.url');
    converted = converted.replace(/pm\.request\.method/g, 'req.method');
    converted = converted.replace(
      /pm\.request\.headers\.get\(([^)]+)\)/g,
      'req.headers.get($1)',
    );
    converted = converted.replace(
      /pm\.request\.headers\.add\(\{[^}]*key:\s*([^,]+),\s*value:\s*([^}]+)\}\)/g,
      'req.headers.set($1, $2)',
    );
    converted = converted.replace(/pm\.request\.body/g, 'req.body');

    converted = converted.replace(/pm\.response\.code/g, 'res.status');
    converted = converted.replace(/pm\.response\.status/g, 'res.statusText');
    converted = converted.replace(
      /pm\.response\.headers\.get\(([^)]+)\)/g,
      'res.headers.get($1)',
    );
    converted = converted.replace(/pm\.response\.json\(\)/g, 'res.json()');
    converted = converted.replace(/pm\.response\.text\(\)/g, 'res.text()');
    converted = converted.replace(/pm\.response\.responseTime/g, '0');

    return converted;
  }

  private indentCode(code: string): string {
    return code
      .split('\n')
      .map((line) => `  ${line.trimEnd()}`)
      .join('\n');
  }
}
