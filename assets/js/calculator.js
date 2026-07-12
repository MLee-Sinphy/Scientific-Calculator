const expressionDisplay = document.querySelector("#expression-display");
const resultDisplay = document.querySelector("#result-display");

const valueButtons = document.querySelectorAll("[data-value]");
const actionButtons = document.querySelectorAll("[data-action]");

let expression = "";

function updateDisplay() {
    expressionDisplay.textContent = expression || "0";
    resultDisplay.textContent = "0";
}

function appendValue(value) {
    expression += value;
    updateDisplay();
}

function clearExpression() {
    expression = "";
    updateDisplay();
}

function removeLastCharacter() {
    expression = expression.slice(0, -1);
    updateDisplay();
}

function calculateExpression() {
    resultDisplay.textContent = "Calculation not implemented yet";
}

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
        calculateExpression();
    }
});

updateDisplay();