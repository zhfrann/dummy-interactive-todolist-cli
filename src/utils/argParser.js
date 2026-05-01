/**
 * Parse CLI arguments that use "--key value" pairs.
 * @param {string[]} argv
 * @returns {{command: string|undefined, options: Object<string, string|boolean>, positionals: string[]}}
 */
function parseArgs(argv) {
    const result = {
        command: undefined,
        options: {},
        positionals: []
    };

    let i = 0;
    while (i < argv.length) {
        const current = argv[i];
        if (current && current.startsWith("--")) {
            const key = current.slice(2);
            if (!key) {
                i += 1;
                continue;
            }

            const next = argv[i + 1];
            if (next !== undefined && !next.startsWith("--")) {
                result.options[key] = next;
                i += 2;
                continue;
            }

            result.options[key] = true;
            i += 1;
            continue;
        }

        if (!result.command) {
            result.command = current;
        } else {
            result.positionals.push(current);
        }
        i += 1;
    }

    return result;
}

module.exports = { parseArgs };
