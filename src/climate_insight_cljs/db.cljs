(ns climate-insight-cljs.db)

;; Mock datasets for development
(def mock-datasets
  [{:id "temperature"
    :name "Global Surface Temperature"
    :description "Monthly global surface temperature anomalies from 1880 to present"
    :source "NASA GISS"
    :unit "°C"
    :time-range "1880-present"}
   {:id "precipitation"
    :name "Global Precipitation"
    :description "Monthly global precipitation data"
    :source "NOAA"
    :unit "mm"
    :time-range "1950-present"}
   {:id "sea-level"
    :name "Sea Level Rise"
    :description "Global mean sea level change data"
    :source "CSIRO"
    :unit "mm"
    :time-range "1993-present"}
   {:id "co2"
    :name "Atmospheric CO2"
    :description "Atmospheric carbon dioxide concentration"
    :source "NOAA ESRL"
    :unit "ppm"
    :time-range "1958-present"}])

;; Mock time series data for development
(defn generate-mock-time-series [start-year end-year base-value trend]
  (let [years (range start-year (inc end-year))
        months (range 1 13)]
    (vec
     (for [year years
           month months
           :let [time-index (+ (* (- year start-year) 12) month)
                 seasonal-effect (* 0.4 (Math/sin (* (/ month 6) Math/PI)))
                 random-effect (- (rand) 0.5)
                 value (+ base-value
                          (* time-index trend)
                          seasonal-effect
                          random-effect)
                 month-str (.padStart (str month) 2 "0")]]
       {:timestamp (str year "-" month-str "-01")
        :value (.toFixed value 2)}))))

;; Default application state
(def default-db
  {:current-route nil
   :auth nil
   :forms {:login {:email ""
                   :password ""}
           :register {:name ""
                      :email ""
                      :password ""}}
   :loading {}
   :errors {}

   ;; For development, preload some datasets
   :datasets mock-datasets

   :current-dataset nil

   ;; Mock time series data can be accessed by:
   ;; (generate-mock-time-series 2010 2020 14.0 0.02) for temperature data
   :time-series nil

   :map {:viewport {:latitude 34.0522
                    :longitude -118.2437
                    :zoom 3
                    :bearing 0
                    :pitch 0}
         :selected-dataset nil}}) 