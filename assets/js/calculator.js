const expressionDisplay = document.querySelector("#expression-display");
const resultDisplay = document.querySelector("#result-display");

const valueButtons = document.querySelectorAll("[data-value]");
const actionButtons = document.querySelectorAll("[data-action]");

let expression = "";

/*
 * Display
 */

function formatExpression(value) {
    return value
        .replaceAll("*", "×")
        .replaceAll("/", "÷")
        .replaceAll("-", "−");
}

function updateDisplay() {
    expressionDisplay.textContent = expression
        ? formatExpression(expression)
        : "0";

    if (!expression) {
        resultDisplay.textContent = "0";
    }
}

/*
 * Input state
 */

function appendValue(value) {
    expression += value;
    updateDisplay();
}

function clearExpression() {
    expression = "";
    resultDisplay.textContent = "0";
    updateDisplay();
}

function removeLastCharacter() {
    expression = expression.slice(0, -1);
    updateDisplay();
}

/*
 * Tokenization
 *
 * Converts:
 * "12.5+(3*4)"
 *
 * into:
 * ["12.5", "+", "(", "3", "*", "4", ")"]
 */

function tokenize(input) {
    const tokens = [];
    let currentNumber = "";

    function finishNumber() {
        if (currentNumber === "") {
            return;
        }

        if (currentNumber === ".") {
            throw new Error("Invalid decimal number.");
        }

        tokens.push(currentNumber);
        currentNumber = "";
    }

    for (const character of input) {
        if (character >= "0" && character <= "9") {
            currentNumber += character;
            continue;
        }

        if (character === ".") {
            if (currentNumber.includes(".")) {
                throw new Error("A number cannot contain multiple decimal points.");
            }

            currentNumber += character;
            continue;
        }

        if ("+-*/^()".includes(character)) {
            finishNumber();
            tokens.push(character);
            continue;
        }

        if (character === " ") {
            finishNumber();
            continue;
        }

        throw new Error(`Unsupported character: ${character}`);
    }

    finishNumber();

    return tokens;
}

/*
 * Infix → Reverse Polish Notation
 *
 * Example:
 * 2 + 3 * 5
 *
 * becomes:
 * 2 3 5 * +
 */

function toPostfix(tokens) {
    const output = [];
    const operators = [];

    const precedence = {
        "+": 1,
        "-": 1,
        "*": 2,
        "/": 2,
        "^": 3,
    };

    const rightAssociative = new Set(["^"]);

    for (const token of tokens) {
        if (!Number.isNaN(Number(token))) {
            output.push(token);
            continue;
        }

        if (token === "(") {
            operators.push(token);
            continue;
        }

        if (token === ")") {
            while (
                operators.length > 0 &&
                operators.at(-1) !== "("
            ) {
                output.push(operators.pop());
            }

            if (operators.length === 0) {
                throw new Error("Unmatched closing parenthesis.");
            }

            operators.pop();
            continue;
        }

        if (token in precedence) {
            while (operators.length > 0) {
                const top = operators.at(-1);

                if (!(top in precedence)) {
                    break;
                }

                const topHasHigherPrecedence =
                    precedence[top] > precedence[token];

                const samePrecedenceAndLeftAssociative =
                    precedence[top] === precedence[token] &&
                    !rightAssociative.has(token);

                if (
                    !topHasHigherPrecedence &&
                    !samePrecedenceAndLeftAssociative
                ) {
                    break;
                }

                output.push(operators.pop());
            }

            operators.push(token);
            continue;
        }

        throw new Error(`Unsupported token: ${token}`);
    }

    while (operators.length > 0) {
        const operator = operators.pop();

        if (operator === "(") {
            throw new Error("Unmatched opening parenthesis.");
        }

        output.push(operator);
    }

    return output;
}

/*
 * Evaluates the postfix expression.
 */

function evaluatePostfix(tokens) {
    const stack = [];

    for (const token of tokens) {
        if (!Number.isNaN(Number(token))) {
            stack.push(Number(token));
            continue;
        }

        if (stack.length < 2) {
            throw new Error("Incomplete mathematical expression.");
        }

        const rightOperand = stack.pop();
        const leftOperand = stack.pop();

        let result;

        switch (token) {
            case "+":
                result = leftOperand + rightOperand;
                break;

            case "-":
                result = leftOperand - rightOperand;
                break;

            case "*":
                result = leftOperand * rightOperand;
                break;

            case "/":
                if (rightOperand === 0) {
                    throw new Error("Division by zero is undefined.");
                }

                result = leftOperand / rightOperand;
                break;

            case "^":
                result = leftOperand ** rightOperand;
                break;

            default:
                throw new Error(`Unsupported operator: ${token}`);
        }

        stack.push(result);
    }

    if (stack.length !== 1) {
        throw new Error("Invalid mathematical expression.");
    }

    return stack[0];
}

function evaluateExpression(input) {
    const tokens = tokenize(input);
    const postfixExpression = toPostfix(tokens);

    return evaluatePostfix(postfixExpression);
}

/*
 * Calculation
 */

function formatResult(value) {
    if (!Number.isFinite(value)) {
        throw new Error("The result is not a finite number.");
    }

    return Number.parseFloat(value.toPrecision(12)).toString();
}

function calculateExpression() {
    if (!expression) {
        return;
    }

    try {
        const result = evaluateExpression(expression);

        resultDisplay.textContent = formatResult(result);
    } catch (error) {
        resultDisplay.textContent = "Error";
        console.error(error.message);
    }
}

/*
 * Button events
 */

valueButtons.forEach((button) => {
    button.addEventListener("click", () => {
        appendValue(button.dataset.value);
    });
});

actionButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const action = button.dataset.action;

        if (action === "clear") {
            clearExpression();
        }

        if (action === "backspace") {
            removeLastCharacter();
        }

        if (action === "calculate") {
            calculateExpression();
        }
    });
});

/*
 * Keyboard events
 */

document.addEventListener("keydown", (event) => {
    const allowedKeys = [
        "0", "1", "2", "3", "4",
        "5", "6", "7", "8", "9",
        "+", "-", "*", "/", "^",
        "(", ")", ".",
    ];

    if (allowedKeys.includes(event.key)) {
        appendValue(event.key);
        return;
    }

    if (event.key === ",") {
        appendValue(".");
        return;
    }

    if (event.key === "Backspace") {
        removeLastCharacter();
        return;
    }

    if (event.key === "Escape") {
        clearExpression();
        return;
    }

    if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        calculateExpression();
    }
});

updateDisplay();