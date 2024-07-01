package main

import (
	//"context"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"

	"github.com/Nalluh/BookStudy/database"
	"github.com/gorilla/sessions"
	_ "github.com/jackc/pgx/v4/stdlib"
	"time"	
)


type FormData struct {
    Name  string
    Email string
	Password string
	Confirm_password string
}

type quizInfo struct{
	BookTitle string
	BookChapter int
	QuizScore float64

}

type userInfo struct {
	BookTitle string
	BookChapter int
	QuizScore float64
	QuizId	int
	QuizDate time.Time
}

var store = sessions.NewCookieStore([]byte("secret-key"))


func main() {
    // Connect to the database
	connStr := ""
    database.Init(connStr)
    defer database.Close()

	
    http.HandleFunc("/static/", serveStatic)

    // Define HTTP handlers
	http.HandleFunc("/home", protectedHandler)
    http.HandleFunc("/sign-in",serveTemplate("HTML/signIn.html"))
    http.HandleFunc("/submit-user-info", submitForm)
	http.HandleFunc("/user-sign-up", serveTemplate("HTMl/signUp.html"))
	http.HandleFunc("/new-user",submitSignUpForm)
	http.HandleFunc("/logout", logoutHandler)
	http.HandleFunc("/profile", serveTemplate("HTML/profile.html"))
	http.HandleFunc("/POST-quiz",postQuizInformation)
	http.HandleFunc("/GET-user",getUserInformation)



    // Start the server
    log.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}	

// serve static files (cs,js,etc)
func serveStatic(w http.ResponseWriter, r *http.Request) {
    path := r.URL.Path[len("/static/"):]
	fmt.Println(path)
    fullPath := filepath.Join("..", "static", path) // Go up one directory    
	fmt.Println(fullPath)

    if _, err := os.Stat(fullPath); os.IsNotExist(err) {
        fmt.Printf("File not found: %s\n", fullPath)
        http.NotFound(w, r)
        return
    }

    // Set correct MIME type
    ext := filepath.Ext(fullPath)
    var contentType string
    switch ext {
    case ".css":
        contentType = "text/css"
    case ".js":
        contentType = "application/javascript"
    default:
        contentType = mime.TypeByExtension(ext)
    }
    w.Header().Set("Content-Type", contentType)

    http.ServeFile(w, r, fullPath)
}

func getUserInformation(w http.ResponseWriter, r *http.Request){

	// make sure get request
if r.Method != http.MethodGet{
	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
	// get user id from session
	session, err := store.Get(r, "user-logged-in")
	if err != nil {
		http.Error(w, "Failed to decode JSON", http.StatusBadRequest)
		return
	}
	// query db 
	var userInfoList []userInfo
	userQuery := "SELECT title,quizid,chapter,quizscore,date FROM book_information where userid =$1"

	rows,err := database.Query(userQuery, session.Values["user_id"])
	if err != nil {
		http.Error(w, "Failed to query database" ,http.StatusInternalServerError)
	}

	defer rows.Close()
	for rows.Next(){
		var user userInfo
		//grab information 
		err = rows.Scan(&user.BookTitle, &user.QuizId, &user.BookChapter, &user.QuizScore, &user.QuizDate)
		if err != nil {
			http.Error(w, "Failed to scan database" ,http.StatusInternalServerError)
		}
		//append information
		userInfoList = append(userInfoList, user)

	}
	// send information to client
	w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(userInfoList)

}


func postQuizInformation(w http.ResponseWriter, r *http.Request) {
	//get user id
	session, err := store.Get(r, "user-logged-in")
	if err != nil {
		http.Error(w, "Failed to decode JSON", http.StatusBadRequest)
		return
	}
	// if not post throw error
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	//get quiz info json
	var quizInfo quizInfo
	err = json.NewDecoder(r.Body).Decode(&quizInfo)

	if err != nil {
		http.Error(w, "Failed to decode JSON", http.StatusBadRequest)
		return
	}

	fmt.Printf("Received data: %+v\n", quizInfo)
	fmt.Printf("user id %d", session.Values["user_id"])
	//insert into database
	quizInfoQuery := "INSERT INTO book_information (title, chapter, QuizScore,UserID) values ($1,$2,$3,$4)"
	err = database.Insert(quizInfoQuery,quizInfo.BookTitle, quizInfo.BookChapter, quizInfo.QuizScore, session.Values["user_id"] )

    if err != nil {
        http.Error(w, "Failed to insert into database", http.StatusInternalServerError)
        return
    } 


	

}


func serveTemplate(templateFile string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		absPath := filepath.Join("..", templateFile)
		tmpl := template.Must(template.ParseFiles(absPath))
		err := tmpl.Execute(w, nil)
		if err != nil {
			http.Error(w, "Failed to render template", http.StatusInternalServerError)
			return
		}
	}
}

func isAuthenticated(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		session, err := store.Get(r, "user-logged-in")
		//check if we have a session
		if err != nil || session.Values["user_id"] == nil {
			// Redirect to sign-in page or handle unauthorized access
			http.Redirect(w, r, "/sign-in", http.StatusSeeOther)
			return
		}

		// User is authenticated, call the next handler
		next.ServeHTTP(w, r)
	})
}

func protectedHandler(w http.ResponseWriter, r *http.Request) {
	// Access user ID from session
	session, err := store.Get(r, "user-logged-in")
	if err != nil || session.Values["user_id"] == nil {
		// User is not logged in, serve home page for non-logged-in users
		serveTemplate("HTML/home.html")(w, r)
	} else {
		// User is logged in, serve home page for logged-in users
		serveTemplate("HTML/home_authenticated.html")(w, r)
	}
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	session, err := store.Get(r, "user-logged-in")
	if err == nil {
		// Clear session data
		delete(session.Values, "user_id")
		session.Save(r, w)
	}
	// Redirect to login page after logout
	http.Redirect(w, r, "/sign-in", http.StatusSeeOther)
}

// Handler for form submission
func submitForm(w http.ResponseWriter, r *http.Request) {
    // Parse form data
    err := r.ParseForm()
    if err != nil {
        http.Error(w, "Failed to parse form", http.StatusInternalServerError)
        return
    }

    // Get form values
    name := r.Form.Get("name")
    password := r.Form.Get("Password")

	formData := FormData{Name: name, Password: password}

	fmt.Printf("Name: %s , Password: %s",formData.Name, formData.Password)
	
    accountQuery := "SELECT id FROM users WHERE name = $1 AND password = $2"

    rows, err := database.Query(accountQuery, formData.Name, formData.Password)
	
	if err != nil {
        http.Error(w, "Failed to query database", http.StatusInternalServerError)
        return
    } 
	defer rows.Close()


	var userID int
	

	if rows.Next(){
		// if account is present log the user in 
		// and authenticate

		err = rows.Scan(&userID)
		fmt.Println(userID)
		if err != nil {
            http.Error(w, "Failed to scan row", http.StatusInternalServerError)
            return
        }
		
		session, err := store.Get(r, "user-logged-in")
		if err != nil {
			http.Error(w, "Failed to create session", http.StatusInternalServerError)
			return
		}
	
		// Set user ID in session
		session.Values["user_id"] =  userID
		session.Save(r, w)
		http.Redirect(w, r, "/home", http.StatusSeeOther)

	}
	
	// if no account found give error	
	http.Redirect(w, r, "/sign-in?error=incorrect", http.StatusSeeOther)
}

func submitSignUpForm(w http.ResponseWriter, r *http.Request) {
	// do not allow any other method
	if r.Method != http.MethodPost {
        http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
        return
    }
	
	//grab form
	err := r.ParseForm()
    if err != nil {
        http.Error(w, "Failed to parse form", http.StatusInternalServerError)
        return
    }

	//set form data
	username := r.Form.Get("username")
	password := r.Form.Get("password")
	email := r.Form.Get("email")
	confirm_pass := r.Form.Get("confirm-password")

	formData := FormData{
	Name: username,
	Password: password,
	Email: email,
	Confirm_password: confirm_pass,
}

	//debug
	fmt.Printf("Name: %s Email: %s Pass: %s Pass Again: %s", formData.Name,formData.Email,formData.Password,formData.Confirm_password)

	//validation
	if formData.Name == "" || formData.Email == "" || formData.Password == "" || formData.Confirm_password  == "" {
        http.Error(w, "Missing form values", http.StatusBadRequest)
        return
    }

	//confirm pass
	if formData.Password != formData.Confirm_password {
			http.Error(w, "Passwords do not match", http.StatusBadRequest)
			return
		}
	

	duplicateAccountQuery := "SELECT email FROM users WHERE email = $1"
	rows, err := database.Query(duplicateAccountQuery,formData.Email)
	if err != nil {
        http.Error(w, "Failed to query database", http.StatusInternalServerError)
        return
    } 
	defer rows.Close()

	// if email exsists in db 
	//return error in url
	if rows.Next() {
		http.Redirect(w, r, "/user-sign-up?error=duplicate_email", http.StatusSeeOther)
		return
    }

	duplicateAccountQuery = "SELECT name FROM users WHERE name = $1"
	rows, err = database.Query(duplicateAccountQuery,formData.Name)
	if err != nil {
        http.Error(w, "Failed to query database", http.StatusInternalServerError)
        return
    } 
	defer rows.Close()

	// if name exsists in db 
	//return error in url
	if rows.Next() {
		http.Redirect(w, r, "/user-sign-up?error=duplicate_username", http.StatusSeeOther)
		return
    }


	//db query
	insertQuery := "INSERT INTO users(name,email,password) values($1,$2,$3)"

	err = database.Insert(insertQuery, formData.Name, formData.Email, formData.Password)

    if err != nil {
        http.Error(w, "Failed to insert into database", http.StatusInternalServerError)
        return
    } 

    http.Redirect(w, r, "/sign-in", http.StatusSeeOther)


}

