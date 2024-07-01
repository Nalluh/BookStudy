  // TODO
    // form validation protect against injection and xss

    const errorMessage = document.getElementById("error-message");
    const password = document.getElementById("password");
    const email = document.getElementById("email");
    const confirm_password = document.getElementById("confirm-password");
    const lengthRequirement = document.getElementById("password-requirement-length");
    const caseRequirement = document.getElementById("password-requirement-case");
    const numberRequirement = document.getElementById("password-requirement-num");
    const specialCharRequirement = document.getElementById("password-requirement-special");


     document.getElementById("signup-form").addEventListener("submit", function(e) {
            e.preventDefault();


            errorMessage.textContent = "";

            if(password.value != confirm_password.value){
                errorMessage.textContent = "Passwords do not match";
                return;
            }

            if(lengthRequirement.style.color == "green" && numberRequirement.style.color == "green" && caseRequirement.style.color == "green" && specialCharRequirement.style.color == "green"){
            this.submit();
            }
            else{
                shakeInputField(password);
                shakeInputField(confirm_password);
            }

     })
     
     password.addEventListener("input", function(e) {
                const passwordValue = e.target.value;
               

                // Check password length
                lengthRequirement.textContent = passwordValue.length > 7 ? "\u2713" : "\u2715";
                lengthRequirement.style.color = passwordValue.length > 7 ? "green" : "red";

                // Check for at least one lowercase and one uppercase letter
                const hasLowercase = /[a-z]/.test(passwordValue);
                const hasUppercase = /[A-Z]/.test(passwordValue);
                caseRequirement.textContent = hasLowercase && hasUppercase ? "\u2713" : "\u2715";
                caseRequirement.style.color = hasLowercase && hasUppercase ? "green" : "red";

                // Check for at least one digit
                const hasDigit = /[0-9]/.test(passwordValue); // Check if there's any digit
                numberRequirement.textContent = hasDigit ? "\u2713" : "\u2715";
                numberRequirement.style.color = hasDigit ? "green" : "red";
                console.log(hasDigit);

                // Check for at least one special character
                const hasSpecialChar = /[^\w\s]/.test(passwordValue); // Matches any character that is not alphanumeric or whitespace
                specialCharRequirement.textContent = hasSpecialChar ? "\u2713" : "\u2715";
                specialCharRequirement.style.color = hasSpecialChar ? "green" : "red";

                
            });

     function checkForDuplicateInformation(e){
        const urlParams = new URLSearchParams(window.location.search);
        const urlError = urlParams.get("error");
    
        if (urlError === "duplicate_email"){
            errorMessage.textContent = "Email already exists, please choose another";
            return;
        }
        if (urlError === "duplicate_username"){
            errorMessage.textContent = "Username already exists, please choose another";
            return;
        }
    }

    function shakeInputField(inputField) {
        inputField.classList.add('shake');

        // Remove the 'shake' class after the animation ends
        setTimeout(() => {
            inputField.classList.remove('shake');
        }, 1000); // Should match the animation duration (0.5s in this case)
        }
   



    checkForDuplicateInformation();
