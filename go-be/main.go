package main

import (
    //"context"
    "fmt"
    "log"
    "html/template"
    "net/http"
    "path/filepath"
	"github.com/Nalluh/BookStudy/database"
	_ "github.com/jackc/pgx/v4/stdlib" 
)


type FormData struct {
    Name  string
    Email string
	Password string
	Confirm_password string
}

func main() {
    // Connect to the database
	connStr := ""
    database.Init(connStr)
    defer database.Close()


    // Define HTTP handlers
    http.HandleFunc("/",serveTemplate("signIn.html"))
    http.HandleFunc("/submit-user-info", submitForm)
	http.HandleFunc("/user-sign-up", serveTemplate("signUp.html"))
	http.HandleFunc("/new-user",submitSignUpForm)


    // Start the server
    log.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
        log.Fatalf("Failed to start server: %v", err)
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
 

    // Redirect back to the homepage after form submission
    http.Redirect(w, r, "/", http.StatusSeeOther)
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

    http.Redirect(w, r, "/", http.StatusSeeOther)


}