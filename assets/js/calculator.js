const expressionDisplay = document.querySelector("#expression-display");
const resultDisplay = document.querySelector("#result-display");

const valueButtons = document.querySelectorAll("[data-value]");
const actionButtons = document.querySelectorAll("[data-action]");
const functionButtons = document.querySelectorAll("[data-function]");
const constantButtons = document.querySelectorAll("[data-constant]");
const modeButtons = document.querySelectorAll("[data-mode]");

let expression = "";
let angleMode = "rad";


/*
 * Display
 */

function formatExpression(value) {
    return value
        .replaceAll("*", "×")
        .replaceAll("/", "÷")
        .replaceAll("-", "−")
        .replace(/\bpi\b/g, "π");
}

function updateDisplay() {
    expressionDisplay.textContent = expression
        ? formatExpression(expression)
        : "0";

    if (!expression) {
        resultDisplay.textContent = "0";
    }
}

function updateAngleModeDisplay() {
    modeButtons.forEach((button) => {
        const isActive = button.dataset.mode === angleMode;
        button.classList.toggle("active", isActive);
    });
}


/*
 * Input state
 */

function appendValue(value) {
    expression += value;
    updateDisplay();
}

function appendConstant(constant) {
    const symbolicValue = constant === "pi" ? "pi" : "e";

    const lastCharacter = expression.at(-1);

    const needsMultiplication =
        expression.length > 0 &&
        (
            (lastCharacter >= "0" && lastCharacter <= "9") ||
            lastCharacter === ")" ||
            lastCharacter === "."
        );

    if (needsMultiplication) {
        expression += "*";
    }

    expression += symbolicValue;
    updateDisplay();
}

function clearExpression() {
    expression = "";
    resultDisplay.textContent = "0";
    updateDisplay();
}

function removeLastCharacter() {
    if (expression.endsWith("pi")) {
        expression = expression.slice(0, -2);
    } else {
        expression = expression.slice(0, -1);
    }

    updateDisplay();
}


/*
 * Tokenization
 */

function tokenize(input) {
    const tokens = [];

    let currentNumber = "";
    let currentIdentifier = "";

    function finishNumber() {
        if (currentNumber === "") {
            return;
        }

        if (
            currentNumber === "." ||
            currentNumber === "-" ||
            currentNumber === "-."
        ) {
            throw new Error("Invalid decimal number.");
        }

        tokens.push(currentNumber);
        currentNumber = "";
    }

    function finishIdentifier() {
        if (currentIdentifier === "") {
            return;
        }

        if (currentIdentifier !== "pi" && currentIdentifier !== "e") {
            throw new Error(
                `Unsupported identifier: ${currentIdentifier}`
            );
        }

        tokens.push(currentIdentifier);
        currentIdentifier = "";
    }

    function previousTokenAllowsUnaryOperator() {
        if (tokens.length === 0) {
            return true;
        }

        const previous = tokens.at(-1);

        return ["+", "-", "*", "/", "^", "("].includes(previous);
    }

    for (let index = 0; index < input.length; index += 1) {
        const character = input[index];

        if (
            character >= "0" &&
            character <= "9"
        ) {
            finishIdentifier();
            currentNumber += character;
            continue;
        }

        if (character === ".") {
            finishIdentifier();

            if (currentNumber.includes(".")) {
                throw new Error(
                    "A number cannot contain multiple decimal points."
                );
            }

            currentNumber += character;
            continue;
        }

        if (
            (character >= "a" && character <= "z") ||
            (character >= "A" && character <= "Z")
        ) {
            finishNumber();
            currentIdentifier += character.toLowerCase();
            continue;
        }

        if (character === "-") {
            finishIdentifier();

            if (
                currentNumber === "" &&
                previousTokenAllowsUnaryOperator()
            ) {
                currentNumber = "-";
                continue;
            }

            finishNumber();
            tokens.push(character);
            continue;
        }

        if (character === "+") {
            finishIdentifier();

            if (
                currentNumber === "" &&
                previousTokenAllowsUnaryOperator()
            ) {
                continue;
            }

            finishNumber();
            tokens.push(character);
            continue;
        }

        if ("*/^()".includes(character)) {
            finishNumber();
            finishIdentifier();

            tokens.push(character);
            continue;
        }

        if (character === " ") {
            finishNumber();
            finishIdentifier();
            continue;
        }

        throw new Error(`Unsupported character: ${character}`);
    }

    finishNumber();
    finishIdentifier();

    return tokens;
}


/*
 * Infix expression → postfix expression
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
        if (
            !Number.isNaN(Number(token)) ||
            token === "pi" ||
            token === "e"
        ) {
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
 * Postfix evaluation
 */

function tokenToNumber(token) {
    if (token === "pi") {
        return Math.PI;
    }

    if (token === "e") {
        return Math.E;
    }

    return Number(token);
}

function evaluatePostfix(tokens) {
    const stack = [];

    for (const token of tokens) {
        if (
            !Number.isNaN(Number(token)) ||
            token === "pi" ||
            token === "e"
        ) {
            stack.push(tokenToNumber(token));
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
                    throw new Error(
                        "Division by zero is undefined."
                    );
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
 * Result formatting
 */

function formatResult(value) {
    if (!Number.isFinite(value)) {
        throw new Error("The result is not a finite number.");
    }

    return Number
        .parseFloat(value.toPrecision(12))
        .toString();
}

function setResult(value) {
    const formattedValue = formatResult(value);

    resultDisplay.textContent = formattedValue;
    expression = formattedValue;

    updateDisplay();
}


/*
 * Arithmetic calculation
 */

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
 * Scientific functions
 */

function degreesToRadians(value) {
    return value * Math.PI / 180;
}

function angleInput(value) {
    if (angleMode === "deg") {
        return degreesToRadians(value);
    }

    return value;
}

function applyScientificFunction(functionName) {
    if (!expression) {
        return;
    }

    try {
        const value = evaluateExpression(expression);

        let result;

        switch (functionName) {
            case "sin":
                result = Math.sin(angleInput(value));
                break;

            case "cos":
                result = Math.cos(angleInput(value));
                break;

            case "tan":
                result = Math.tan(angleInput(value));
                break;

            case "sinh":
                result = Math.sinh(value);
                break;

            case "cosh":
                result = Math.cosh(value);
                break;

            case "tanh":
                result = Math.tanh(value);
                break;

            case "log":
                if (value <= 0) {
                    throw new Error(
                        "The logarithm requires a positive argument."
                    );
                }

                result = Math.log10(value);
                break;

            case "ln":
                if (value <= 0) {
                    throw new Error(
                        "The natural logarithm requires a positive argument."
                    );
                }

                result = Math.log(value);
                break;

            case "sqrt":
                if (value < 0) {
                    throw new Error(
                        "The real square root requires a non-negative argument."
                    );
                }

                result = Math.sqrt(value);
                break;

            case "square":
                result = value ** 2;
                break;

            case "exp":
                result = Math.exp(value);
                break;

            case "percent":
                result = value / 100;
                break;

            case "inverse":
                if (value === 0) {
                    throw new Error(
                        "The multiplicative inverse of zero is undefined."
                    );
                }

                result = 1 / value;
                break;

            case "sign":
                result = -value;
                break;

            default:
                throw new Error(
                    `Unsupported scientific function: ${functionName}`
                );
        }

        setResult(result);
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
            return;
        }

        if (action === "backspace") {
            removeLastCharacter();
            return;
        }

        if (action === "calculate") {
            calculateExpression();
        }
    });
});

functionButtons.forEach((button) => {
    button.addEventListener("click", () => {
        applyScientificFunction(button.dataset.function);
    });
});

constantButtons.forEach((button) => {
    button.addEventListener("click", () => {
        appendConstant(button.dataset.constant);
    });
});

modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        angleMode = button.dataset.mode;
        updateAngleModeDisplay();
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


/*
 * Initial state
 */

updateDisplay();
updateAngleModeDisplay();