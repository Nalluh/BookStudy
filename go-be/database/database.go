// database.go
package database

import (
    "context"
    "log"

    "github.com/jackc/pgx/v4"
)

var db *pgx.Conn

// Init initializes the database connection
func Init(connStr string) {
    var err error
    db, err = pgx.Connect(context.Background(), connStr)
    if err != nil {
        log.Fatalf("Unable to connect to database: %v\n", err)
    }
}

//  closes the database connection
func Close() {
    db.Close(context.Background())
}

func Query(queryString string, args ...interface{}) (pgx.Rows, error) {
    rows, err := db.Query(context.Background(), queryString, args...)
    if err != nil {
        log.Printf("Error executing query: %v\n", err)
        return nil, err
    }
    return rows, nil
}

func Insert(queryString string, args ...interface{}) error {
    _, err := db.Exec(context.Background(), queryString, args...)
    if err != nil {
        log.Printf("Error executing insert: %v\n", err)
        return err
    }
    return nil
}


