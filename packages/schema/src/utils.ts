export class YasumuSchemaUtils {
    static isWhitespace(text: string) {
        return text.trim().length === 0;
    }

    static isNumericChar(char: string) {
        if (char === "") {
            return false;
        }
        const codePoint = char.codePointAt(0)!;
        return codePoint >= 48 && codePoint <= 57;
    }

    static isAlphabeticChar(char: string) {
        if (char === "") {
            return false;
        }
        const codePoint = char.codePointAt(0)!;
        return (
            codePoint === 95 ||
            (codePoint >= 65 && codePoint <= 90) ||
            (codePoint >= 97 && codePoint <= 122)
        );
    }

    static isIdentifier(char: string) {
        if (char === "") {
            return false;
        }
        return this.isNumericChar(char) || this.isAlphabeticChar(char);
    }

    static isIdentifierString(value: string) {
        if (value.length === 0) {
            return false;
        }
        if (!this.isAlphabeticChar(value[0])) {
            return false;
        }
        for (let i = 1; i < value.length; i++) {
            if (!this.isIdentifier(value[i])) {
                return false;
            }
        }
        return true;
    }

    static maybeParseInt(value: string, radix?: number) {
        try {
            return parseInt(value, radix);
        } catch (_) {
            return;
        }
    }

    static enum<T extends string>(values: readonly T[]) {
        return values.reduce(
            (pv, cv) => {
                pv[cv] = cv;
                return pv;
            },
            {} as { [K in T]: K },
        );
    }
}
