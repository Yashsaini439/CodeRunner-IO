const compileBtn = document.getElementById('compileBtn');
const codeEditor = document.getElementById('codeEditor');
const languageSelect = document.getElementById('languageSelect');
const outputConsole = document.getElementById('outputConsole');

let timerId = null;

compileBtn.addEventListener('click', async () => {
  const code = codeEditor.value.trim();
  const langId = languageSelect.value;

  if (!code) {
    outputConsole.textContent = "Error: Code cannot be empty.";
    return;
  }

  // Clear previous timers and reset UI
  if (timerId) clearInterval(timerId);
  outputConsole.textContent = "Compiling and submitting code...";
  compileBtn.disabled = true;

  try {
    // Simulated POST request
    const result = await mockExecuteCode(code, langId);

    if (result.error) {
      outputConsole.textContent = `Error: ${result.error}`;
      compileBtn.disabled = false;
      return;
    }

    if (result.codeId) {
      outputConsole.textContent = "Code submitted successfully. Waiting for execution result...";
      pollForResult(result.codeId, code);
    }
  } catch (err) {
    outputConsole.textContent = "Network error while submitting code.";
    compileBtn.disabled = false;
  }
});

function pollForResult(codeId, userCode) {
  let attempts = 0;

  timerId = setInterval(async () => {
    attempts++;

    // Simulated GET request
    const result = await mockGetCodeResult(codeId, attempts, userCode);
    let data = result.data;

    if (data && Object.keys(data).length > 0) {
      clearInterval(timerId);
      compileBtn.disabled = false;

      if (data.errors && data.errors.trim() !== "") {
        outputConsole.textContent = data.errors;
      } else {
        outputConsole.textContent = data.output || "Code executed with no output.";
      }
    } else {
      outputConsole.textContent = "Executing code... Please wait.";
    }
  }, 2000);
}

// --- MOCK API FUNCTIONS ---
function mockExecuteCode(code, langId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ codeId: "job_" + Date.now() });
    }, 1000);
  });
}

function mockGetCodeResult(codeId, attempt, userCode) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (attempt < 2) {
        resolve({ data: {} });
      } else {
        resolve({
          data: {
            output: evaluateOutput(userCode),
            langid: "0",
            code: userCode,
            errors: ""
          }
        });
      }
    }, 500);
  });
}

function evaluateOutput(code) {
  try {
    const printMatches = code.match(/(?:print|console\.log)\((.*?)\)/g);
    if (printMatches) {
      const variableDeclarations = code
        .split('\n')
        .filter(line => line.includes('=') && !line.includes('print'))
        .map(line => 'let ' + line.trim() + ';')
        .join(' ');

      const outputs = printMatches.map(statement => {
        const innerExpr = statement.match(/\((.*?)\)/)[1];
        return new Function(`${variableDeclarations} return ${innerExpr};`)();
      });

      return outputs.join('\n');
    }
  } catch (err) {
    // Fallback if parsing fails
  }
  return "Program executed successfully.";
}