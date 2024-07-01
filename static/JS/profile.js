//where we will display information
const quizResultsElement = document.getElementById('quizResults');

//append
function displyQuizInformation(data){
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.BookTitle}</td>
            <td>${item.BookChapter}</td>
            <td>${item.QuizScore.toFixed(2)}%</td>
            <td>${formatDate(item.QuizDate)}</td>
        `;
        quizResultsElement.appendChild(row);
    });
    
    }
//get data
async function getUserInformation(){
    const url = 'http://localhost:8080/GET-user';
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    displyQuizInformation(data);
}
// remove excess from data and reverse for proper display
function formatDate(inputDate){
    //2024-07-01T00:00:00Z

    const dateArray = inputDate.split('T');
    console.log(dateArray[0][6])
    let day = dateArray[0].substring(8,10);
    let month = dateArray[0].substring(5,7);
    let year = dateArray[0].substring(0,4);
    return `${month}-${day}-${year}`
}


getUserInformation();

    



