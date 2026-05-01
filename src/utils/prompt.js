const readline = require("readline");

/**
 * Create a prompter for interactive CLI flows.
 * @param {NodeJS.ReadableStream} [input]
 * @param {NodeJS.WritableStream} [output]
 */
function createPrompter(input = process.stdin, output = process.stdout) {
    const rl = readline.createInterface({ input, output });

    const ask = (question) =>
        new Promise((resolve) => {
            rl.question(question, (answer) => resolve(answer));
        });

    const confirm = async (question, defaultYes = false) => {
        const suffix = defaultYes ? "[Y/n]" : "[y/N]";
        while (true) {
            const raw = await ask(`${question} ${suffix} `);
            const value = String(raw || "").trim().toLowerCase();
            if (!value) {
                return defaultYes;
            }

            if (value === "y" || value === "yes") {
                return true;
            }

            if (value === "n" || value === "no") {
                return false;
            }

            console.log("Please answer yes or no.");
        }
    };

    const close = () => rl.close();

    return { ask, confirm, close };
}

module.exports = { createPrompter };
