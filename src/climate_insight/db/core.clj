(ns climate-insight.db.core
  (:require [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]
            [honey.sql :as sql]
            [mount.core :refer [defstate]]
            [taoensso.timbre :as log]
            [next.jdbc.connection :as connection])
  (:import (org.postgresql.util PGobject)
           (java.sql Timestamp Array)
           (java.time LocalDateTime)))

;; Database connection handling
(defn get-db-url []
  (or (System/getenv "DATABASE_URL")
      "jdbc:postgresql://localhost:5432/climate_insight?user=postgres&password=postgres"))

(defstate ^:dynamic *db*
  :start (let [db-url (get-db-url)
               _ (log/info "Starting database connection to" db-url)
               conn (jdbc/get-datasource db-url)]
           {:datasource conn})
  :stop (log/info "Closing database connection"))

;; Helper functions for database interactions
(defn query
  "Execute a query and return results as Clojure data structures."
  [q]
  (jdbc/execute! *db* q {:builder-fn rs/as-unqualified-maps}))

(defn query-one
  "Execute a query and return the first result."
  [q]
  (first (query q)))

(defn execute!
  "Execute a statement and return the number of affected rows."
  [q]
  (jdbc/execute-one! *db* q))

;; SQL query helpers using HoneySQL
(defn format-query [query-map]
  (sql/format query-map))

(defn select
  "Executes a SELECT query built with HoneySQL map syntax."
  [query-map]
  (query (format-query query-map)))

(defn select-one
  "Executes a SELECT query and returns the first result."
  [query-map]
  (query-one (format-query query-map)))

(defn insert!
  "Executes an INSERT query built with HoneySQL map syntax."
  [table data]
  (execute! (format-query {:insert-into table
                           :values [data]
                           :returning :*})))

(defn update!
  "Executes an UPDATE query built with HoneySQL map syntax."
  [table data where-clause]
  (execute! (format-query {:update table
                           :set data
                           :where where-clause
                           :returning :*})))

(defn delete!
  "Executes a DELETE query built with HoneySQL map syntax."
  [table where-clause]
  (execute! (format-query {:delete-from table
                           :where where-clause})))

;; PostGIS-specific functionality
(defn point
  "Creates a PostGIS Point from longitude and latitude"
  [lon lat]
  (jdbc/execute-one! *db* ["SELECT ST_SetSRID(ST_MakePoint(?, ?), 4326) as point" lon lat]))

(defn get-geojson
  "Converts a PostGIS geometry to GeoJSON"
  [geom]
  (:st_asgeojson (jdbc/execute-one! *db* ["SELECT ST_AsGeoJSON(?) as st_asgeojson" geom])))

(comment
  ;; REPL examples
  (query ["SELECT NOW()"])

  (select {:select [:*]
           :from [:datasets]
           :limit 10})

  (insert! :users {:name "Test User"
                   :email "test@example.com"
                   :password_hash "hash"})

  ;; PostGIS example
  (point -122.4194 37.7749)) 