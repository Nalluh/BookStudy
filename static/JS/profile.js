//where we will display information
const quizResultsElement = document.getElementById('quizResults');
let currentPage = 1;
const itemsPerPage = 15;
//append
function displayQuizInformation(data, page = 1){

    quizResultsElement.innerHTML = ''; 
    //display 15 items and create next button for the proceeding 15 items 
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = data.slice(startIndex, endIndex);

    paginatedItems.forEach((item, index) => {
        // Create a row for the quiz info
        const row = document.createElement('tr');
        row.setAttribute('id', `infoRow${index}`);
        row.innerHTML = `
            <td>${item.BookTitle}</td>
            <td>${item.BookChapter}</td>
            <td>${item.QuizScore.toFixed(2)}%</td>
            <td>${formatDate(item.QuizDate)}</td>
        `;
        row.onclick = () => handleRowClick(item, index); // Pass the item and index to the handler
        quizResultsElement.appendChild(row);

        // Create a separate row for the question details
        const infoRow = document.createElement('tr');
        const infoCell = document.createElement('td');
        infoCell.setAttribute('colspan', '4'); 
        infoCell.innerHTML = `
            <div id="infoChild${index}" style="display: none;"></div>
        `;
        infoRow.appendChild(infoCell);
        quizResultsElement.appendChild(infoRow);

    });

    displayPaginationButtons(data.length, page, data);

}

async function handleRowClick(item, index) {
    // Get the correct infoChild div for the clicked row
    let infoDiv = document.getElementById(`infoChild${index}`);

    // If the div is already shown, hide it (toggle behavior)
    if (infoDiv.style.display === "block") {
        infoDiv.style.display = "none";
        return;
    }

    // Fetch the quiz questions from the backend
    let info = await GETQuizQuestions(item);

    // Build the inner HTML for the questions and answers
    infoDiv.innerHTML = info.map(element => `
        <p><strong>Question:</strong> ${element.Question}</p>
        <p><strong>Correct Answer:</strong> ${element.CorrectAnswer}</p>
        <p><strong>Your Answer:</strong> ${element.UserAnswer}</p>
    `).join('');

    // Show the div
    infoDiv.style.display = "block";
}
    
    async function GETQuizQuestions(item){
        //pass in item.quizid and GET back the question information 
        console.log(item.QuizId);
        try {
            const response = await fetch(`http://localhost:8080/GET-quiz?param=${encodeURIComponent(item.QuizId)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            console.log(data);
            return data;
        }
       catch (error) {
            console.error('Error:', error);
        }

    }

    function displayPaginationButtons(totalItems, currentPage, data) {
        const paginationElement = document.getElementById('pagination'); 
    paginationElement.innerHTML = ''; 

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Create Previous button
    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.setAttribute('id', 'prevButton')
        prevButton.setAttribute('class','btn btn-primary')
        prevButton.onclick = () => displayQuizInformation(data, currentPage - 1);
        paginationElement.appendChild(prevButton);
    }

    // Create Next button
    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.setAttribute('id', 'nextButton')
        nextButton.setAttribute('class','btn btn-primary')
        nextButton.onclick = () => displayQuizInformation(data, currentPage + 1);
        paginationElement.appendChild(nextButton);
    }
}

    
//get data
async function getUserInformation(){
    const url = 'http://localhost:8080/GET-user';
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    displayQuizInformation(data);
}
// remove excess from data and reverse for proper display
function formatDate(inputDate){
    //2024-07-01T00:00:00Z

    const dateArray = inputDate.split('T');
    let day = dateArray[0].substring(8,10);
    let month = dateArray[0].substring(5,7);
    let year = dateArray[0].substring(0,4);
    return `${month}-${day}-${year}`
}


getUserInformation();

    



