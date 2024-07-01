
//radio buttons allow for muliple choice
//handle case were user does not select an answer

//grab DOM elements
const bookTitle = document.getElementById('bookInputForm');
const bookChapter = document.getElementById('bookChapter');
const questionCount = document.getElementById('questionNums');
const bookContent = document.getElementById("bookContent");

//when button is submitted
document.getElementById('bookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log(bookTitle.value + " " + bookChapter.value);
    //reset content div
    bookContent.innerHTML = "";
    //remove none from styling to show loading. -> loading.. etc animation
    loadingText.style.display = "block";
    startLoadingAnimation(); 
    // adds a random fact with the loading
    addFact();
    // pass book title, chapter, and question amount to ChatGPT 
    callChatGPT(bookTitle.value,bookChapter.value,questionCount.value);
})

// add "." to the end of loading to give animation effect
function startLoadingAnimation() {
    let loadingCount = 1;
    
    loadingInterval = setInterval(() => {
        if (loadingCount <= 4) {
            loadingText.innerHTML += ".";
            loadingCount++;
        } else {
            loadingText.innerHTML = "Loading.";
            loadingCount = 2;
        }
    }, 300); 
}

//Once async function returns a callback we stop the loading animation
function stopLoadingAnimation() {
    clearInterval(loadingInterval);
}

// pass in api response
// seperate it so we can display
function separateChapters(chaptersString) {
    const chaptersArray = chaptersString.split('\n');
    return chaptersArray;
}

//calls grabRandomFact and waits to get fact
async function addFact(){
    const factText = await grabRandomFact();
    // if promise is not null create div and show fact
            if (factText) {
                const factElement = document.createElement('div');
                factElement.className = "factDiv";
                factElement.innerHTML = "Randon Fact:<br>"+factText;
                bookContent.appendChild(factElement);
    // else create div and show error
            } else {
                const errorElement = document.createElement('div');
                errorElement.className = "factDiv";
                errorElement.innerHTML = 'Could not fetch a random fact.';
                bookContent.appendChild(errorElement);
            }
}


async function callChatGPT(bookTitle, bookChapter, questionCount) {

    // set information for api call
            const apiKey = 'sk-proj-';
            const apiUrl = 'https://api.openai.com/v1/chat/completions';

            const headers = {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            };

            const data = {
               // model: 'gpt-4',
                model: 'gpt-3.5-turbo',
                // prompt to get consistent response 
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: `Give me a quiz for ${bookTitle} chapter: ${bookChapter} multiple choice with ${questionCount} questions with the answer as well, 
                    do not include any additional information only the question and multiple choice. 
                    For example do not inlude "Sure here are ..." also do not add a newline until the question is written. 
                    Follow this format: 1. What is one detail that describes the Valley of Ashes?
                    A. A vibrant area full of life
                    B. A desolate and dreary industrial waste land
                    C. A high-end neighborhood for the wealthy
                    D. A serene countryside retreat
                    Answer: B`  
                }
                ]
            };
            // post request
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const responseData = await response.json();
                // verify response
                console.log(responseData.choices);
                //seperate response into an array
                const bookChapters = (separateChapters(responseData.choices[0].message.content));
                // clear book content for quiz
                bookContent.innerHTML = "";
                //shows book quiz
                createAndShowQuiz(bookChapters);
                
            } catch (error) {
                console.error('Error calling ChatGPT API:', error);
            }
            finally {
                // once callback is completed reset loadingText to none
                loadingText.style.display = "none";
                // stop the interval
                stopLoadingAnimation();
                document.getElementById("base-container").style.height = "auto";
            }
        }

    //organize book chapters into a form with the question as header
    // in an unordered list with the answers options as li
function createAndShowQuiz(bookChapters) {
    let counter = 0;
    let questionList = null;
    let questions = [];
    let answers = [];
    let questionNumber = 1;
    const form = document.createElement("form");
    
    bookChapters.forEach((element, index) => {
        if (element != "") { 
            // c = 0 means we are at the question
            if (counter === 0) {
                const fieldset = document.createElement("fieldset");
                const legend = document.createElement("legend");
                questionList = document.createElement("ul");
                legend.textContent = element;
                fieldset.appendChild(legend);
                fieldset.appendChild(questionList);
                form.appendChild(fieldset);
                questions.push(element);
                counter++;
            } else {
                // c > 4 means we are at the answer 
                // save it in array
                if (counter > 4) {
                    answers.push(element);
                    console.log(questionNumber);
                    console.log(element);
                    counter = 0;
                    questionNumber++;
                } else if(counter < 5) { 
                    // Append choices as radio buttons to unordered list
                    const listItem = document.createElement("li");
                    const radioInput = document.createElement("input");
                    radioInput.type = "radio";
                    radioInput.name = `question${questionNumber}`; // Ensure each question has a unique name
                    radioInput.value = element;
                    const label = document.createElement("label");
                    label.appendChild(radioInput);
                    label.appendChild(document.createTextNode(element));
                    listItem.appendChild(label);
                    questionList.appendChild(listItem);
                    counter++;
                    
                }
            }
        }
    });


     // Create and append a submit button
    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Submit";
    submitButton.className = "btn btn-seconday";
    submitButton.setAttribute("id", "quizSubmitBtn");
    submitButton.setAttribute("data-toggle", "modal");
    submitButton.setAttribute("data-target", "#quizResultModal");
    form.appendChild(submitButton);

    // Append the form to the bookContent element
    bookContent.appendChild(form);

    // when form is submitted check if answers are correct 
    form.addEventListener("submit", submitQuizForm(answers,questions));

}


// apicall for fact 
async function grabRandomFact(){
                const apiURL = "https://api.api-ninjas.com/v1/facts";
                try{
                    const response = await fetch(apiURL,{
                        method: 'GET',
                        headers: { 'X-Api-Key': '=='},
                        contentType: 'application/json',
                    });

                    if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const responseData = await response.json();
                console.log(responseData[0].fact)
                return responseData[0].fact;

                }catch (error) {
                console.error('Error calling api-ninjas:', error);
            }
            }

 function submitQuizForm(correctAnswers,questions) {
                return function(e) {
                   e.preventDefault(); // Prevent form submission
                   let incorrectQuestions = [];
                   const scoreDisplay = document.getElementById("scoreDisplay");
                   const incorrectAnswersDisplay = document.getElementById("incorrectAnswers");
                   const closeButton = document.getElementById("modal-close");

                   //get user selected answers 
                    const radioInputs = document.querySelectorAll("input[type='radio']:checked");
                     // Check answers
                    const score = [...radioInputs].map((input, index) => {
                        //get user input
                        const selectedAnswer = input.value;
                        // format user input to match answer key
                        const formattedSelectedAnswer = "Answer: " + selectedAnswer[0];
                        //if answer is wrong append to wrong answer array 
                        if (formattedSelectedAnswer !== correctAnswers[index])
                        {   
                            incorrectQuestions.push(questions[index]);
                        }
                        // Check if the selected answer is correct and return 1 if it is, otherwise return 0
                        return formattedSelectedAnswer === correctAnswers[index] ? 1 : 0;
                    }).reduce((acc, current) => acc + current, 0);
                    // calculate score
                    const percentageScore = (score / correctAnswers.length) * 100;
                    // add to modal
                    scoreDisplay.innerHTML = `Quiz score: ${percentageScore.toFixed(2)}%`;
                    // if length is grt than 0 show incorrect questions
                    if( incorrectQuestions.length > 0 )
                   {
                    incorrectAnswersDisplay.innerHTML += '<br> Incorrect Questions:';
                     incorrectQuestions.forEach(function(question) {
                        incorrectAnswersDisplay.innerHTML += '<br>' + question;
                    });}
                    // else we have no incorrect answers, user got a %100
                    else{
                        incorrectAnswersDisplay.innerHTML = "Congratulations on the perfect score! Well done!";
                    }
                    //when modal is closed reset information 
                    closeButton.addEventListener("click", function(){
                        incorrectAnswersDisplay.innerHTML = "";
                    })
                };
}
