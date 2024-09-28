document.getElementById("submitBtn").addEventListener("click", function () {
    const regexInput = document.getElementById("regexInput").value;
    const regexVariable = regexInput;
    document.getElementById("result").innerText =
      "Expresión regular guardada: " + regexVariable;
  });
  