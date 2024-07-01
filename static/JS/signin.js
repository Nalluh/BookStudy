
const errorMessage = document.getElementById("error-message");
//check if error in url 
function incorrectLogin(e){
 const urlParams = new URLSearchParams(window.location.search);
 const urlError = urlParams.get("error");
 console.log(urlError)
 //if error append error msg
 if (urlError === "incorrect"){
     errorMessage.textContent = "Oops! It seems there was an issue with your login credentials. Please double-check your username and password and try again";
     return;
 }

}

incorrectLogin();