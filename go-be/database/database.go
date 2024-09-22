// database.go
package database

import (
    "context"
    "log"
    "github.com/jackc/pgx/v4"
    "github.com/jackc/pgx/v4/pgxpool"
)

var pool *pgxpool.Pool

// Init initializes the connection pool
func Init(connStr string) {
    var err error
    pool, err = pgxpool.Connect(context.Background(), connStr)
    if err != nil {
        log.Fatalf("Unable to connect to database: %v\n", err)
    }
}

// Close closes the database connection pool
func Close() {
    pool.Close()
}

// Query executes a query that returns multiple rows
func Query(queryString string, args ...interface{}) (pgx.Rows, error) {
    rows, err := pool.Query(context.Background(), queryString, args...)
    if err != nil {
        log.Printf("Error executing query: %v\n", err)
        return nil, err
    }
    return rows, nil
}

// Insert executes an insert query
func Insert(queryString string, args ...interface{}) error {
    _, err := pool.Exec(context.Background(), queryString, args...)
    if err != nil {
        log.Printf("Error executing insert: %v\n", err)
        return err
    }
    return nil
}

// QueryRow executes a query that returns a single row
func QueryRow(queryString string, args ...interface{}) pgx.Row {
    return pool.QueryRow(context.Background(), queryString, args...)
}
