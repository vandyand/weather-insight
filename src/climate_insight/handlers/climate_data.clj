(ns climate-insight.handlers.climate-data
  (:require [climate-insight.db.core :as db]
            [taoensso.timbre :as log]))

(defn get-datasets
  "Handler for retrieving all available datasets"
  [_]
  (try
    (let [datasets (db/select {:select [:id :name :description :source :source_url :metadata]
                               :from [:datasets]})]
      {:status 200
       :body {:datasets datasets}})
    (catch Exception e
      (log/error "Error retrieving datasets" e)
      {:status 500
       :body {:error "Failed to retrieve datasets"}})))

(defn get-dataset
  "Handler for retrieving a specific dataset by ID"
  [{{{:keys [id]} :path} :parameters}]
  (try
    (let [dataset (db/select-one {:select [:*]
                                  :from [:datasets]
                                  :where [:= :id (Integer/parseInt id)]})
          variables (db/select {:select [:*]
                                :from [:dataset_variables]
                                :where [:= :dataset_id (Integer/parseInt id)]})]
      (if dataset
        {:status 200
         :body (assoc dataset :variables variables)}
        {:status 404
         :body {:error "Dataset not found"}}))
    (catch Exception e
      (log/error "Error retrieving dataset" e)
      {:status 500
       :body {:error "Failed to retrieve dataset"}})))

(defn get-time-series
  "Handler for retrieving time series data for a location"
  [{{:keys [body]} :parameters}]
  (try
    (let [{:keys [dataset-id lat lon start-date end-date]} body

          ;; First, find the variable ID for this dataset
          variable (db/select-one {:select [:id]
                                   :from [:dataset_variables]
                                   :where [:= :dataset_id (Integer/parseInt dataset-id)]
                                   :limit 1})

          ;; Create a PostGIS point from the coordinates
          point (db/point lon lat)

          ;; Query for time series data
          time-series (db/query
                       ["SELECT timestamp, value
                         FROM data_points
                         WHERE dataset_id = ?
                         AND variable_id = ?
                         AND timestamp BETWEEN ? AND ?
                         AND ST_DWithin(location, ?, 50000) -- 50km radius
                         ORDER BY timestamp ASC"
                        (Integer/parseInt dataset-id)
                        (:id variable)
                        start-date
                        end-date
                        (:point point)])]

      {:status 200
       :body {:time_series time-series
              :dataset_id dataset-id
              :location {:lat lat
                         :lon lon}}})
    (catch Exception e
      (log/error "Error retrieving time series data" e)
      {:status 500
       :body {:error "Failed to retrieve time series data"}})))

(defn generate-sample-data
  "Generates sample time series data for demonstration purposes"
  [lat lon dataset-id start-date end-date]
  (let [;; For demo purposes, generate some plausible data
        points (case dataset-id
                 ;; Temperature data - warming trend with seasonal variation
                 "1" (map (fn [i]
                            (let [date (java.time.LocalDate/parse start-date)
                                  current-date (.plusDays date i)
                                  year-fraction (/ (.getDayOfYear current-date) 365.0)
                                  seasonal-component (* 0.5 (Math/sin (* 2 Math/PI year-fraction)))
                                  trend-component (* 0.02 i)
                                  random-component (- (rand 0.3) 0.15)]
                              {:timestamp (.toString current-date)
                               :value (+ seasonal-component trend-component random-component)}))
                          (range 0 (min 365 (- (.toEpochDay (java.time.LocalDate/parse end-date))
                                               (.toEpochDay (java.time.LocalDate/parse start-date))))))

                 ;; Sea level - steady rise
                 "2" (map (fn [i]
                            (let [date (java.time.LocalDate/parse start-date)
                                  current-date (.plusDays date i)
                                  trend-component (* 0.1 i)
                                  random-component (- (rand 0.5) 0.25)]
                              {:timestamp (.toString current-date)
                               :value (+ 25.0 trend-component random-component)}))
                          (range 0 (min 365 (- (.toEpochDay (java.time.LocalDate/parse end-date))
                                               (.toEpochDay (java.time.LocalDate/parse start-date))))))

                 ;; Default - fallback data
                 (map (fn [i]
                        (let [date (java.time.LocalDate/parse start-date)
                              current-date (.plusDays date i)]
                          {:timestamp (.toString current-date)
                           :value (rand 10.0)}))
                      (range 0 (min 365 (- (.toEpochDay (java.time.LocalDate/parse end-date))
                                           (.toEpochDay (java.time.LocalDate/parse start-date)))))))]
    points)) 