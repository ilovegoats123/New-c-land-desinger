// === 1. Lexer ===
function lexer(input) {
  // Matches: let, print, identifiers, numbers, symbols
  const regex = /\s*(let|print|[A-Za-z_]\w*|\d+|[=;+()])\s*/g;
  let tokens = [];
  let m;
  while ((m = regex.exec(input)) !== null) {
    tokens.push(m[1]);
  }
  return tokens;
}

// === 2. Parser ===
function parse(tokens) {
  let pos = 0;

  function peek() {
    return tokens[pos];
  }
  function eat(tok) {
    if (peek() === tok) {
      pos++;
    } else {
      throw new Error(`Expected '${tok}', found '${peek()}'`);
    }
  }
  function parseNumberOrIdentifier() {
    const token = peek();
    if (/^\d+$/.test(token)) {
      pos++;
      return { type: "Number", value: Number(token) };
    } else if (/^[A-Za-z_]\w*$/.test(token)) {
      pos++;
      return { type: "Identifier", name: token };
    } else {
      throw new Error(`Expected number or identifier, got '${token}'`);
    }
  }
  function parseExpr() {
    let left = parseNumberOrIdentifier();
    if (peek() === "+") {
      eat("+");
      let right = parseNumberOrIdentifier();
      return { type: "BinaryExpr", operator: "+", left, right };
    }
    return left;
  }
  function parseStatement() {
    if (peek() === "let") {
      eat("let");
      let name = peek();
      eat(name);
      eat("=");
      let expr = parseExpr();
      eat(";");
      return { type: "VarDecl", name, expr };
    } else if (peek() === "print") {
      eat("print");
      eat("(");
      let expr = parseExpr();
      eat(")");
      eat(";");
      return { type: "Print", expr };
    } else {
      throw new Error(`Unknown statement: '${peek()}'`);
    }
  }
  let body = [];
  while (pos < tokens.length) {
    if (!peek()) break;
    body.push(parseStatement());
  }
  return { type: "Program", body };
}

// === 3. Interpreter ===
function run(ast) {
  let env = {};
  let output = [];
  function evalExpr(expr) {
    if (expr.type === "Number") return expr.value;
    if (expr.type === "Identifier") {
      if (!(expr.name in env))
        throw new Error(`Undeclared variable '${expr.name}'`);
      return env[expr.name];
    }
    if (expr.type === "BinaryExpr") {
      let l = evalExpr(expr.left);
      let r = evalExpr(expr.right);
      if (expr.operator === "+") return l + r;
      throw new Error(`Unknown operator '${expr.operator}'`);
    }
    throw new Error(`Unknown expr type '${expr.type}'`);
  }
  for (let stmt of ast.body) {
    if (stmt.type === "VarDecl") {
      if (stmt.name in env)
        throw new Error(`Variable '${stmt.name}' already declared`);
      env[stmt.name] = evalExpr(stmt.expr);
    } else if (stmt.type === "Print") {
      let value = evalExpr(stmt.expr);
      output.push(String(value));
    } else {
      throw new Error(`Unknown statement type '${stmt.type}'`);
    }
  }
  return output.join("\n");
}

// === 4. UI Glue ===
document.getElementById("run-btn").onclick = function () {
  const code = document.getElementById("code").value;
  const outputEl = document.getElementById("output");
  try {
    const tokens = lexer(code);
    const ast = parse(tokens);
    const result = run(ast);
    outputEl.textContent = result;
  } catch (e) {
    outputEl.textContent = "Error: " + e.message;
  }
};
