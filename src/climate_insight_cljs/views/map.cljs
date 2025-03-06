(ns climate-insight-cljs.views.map
  (:require [reagent.core :as r]
            [re-frame.core :as rf]
            [climate-insight-cljs.events :as events]
            ["mapbox-gl" :as mapbox]
            ["react-map-gl" :refer [Map Marker Popup]]))

;; Set Mapbox access token - import directly from config
(def debug-token-info
  (let [token (.-MAPBOX_TOKEN js/window)
        token-exists? (boolean (and token (not-empty token)))]
    (js/console.log "Map component accessing Mapbox token:" (if token-exists?
                                                              (str "Found (length: " (count token) ")")
                                                              "Not found"))
    token-exists?))

;; Use the window.MAPBOX_TOKEN which is set by our config module
(def mapbox-token (.-MAPBOX_TOKEN js/window))

;; Map component with Mapbox integration
(defn map-component []
  (let [selected-dataset (rf/subscribe [:selected-dataset])
        datasets (rf/subscribe [:datasets])
        time-series (rf/subscribe [:time-series])
        loading? (rf/subscribe [:loading :time-series])

        ;; Local state for the map
        map-state (r/atom {:viewport {:latitude 37.7749  ;; San Francisco
                                      :longitude -122.4194
                                      :zoom 10}
                           :selected-point nil
                           :popup-info nil})

        ;; Function to handle map click events
        handle-map-click (fn [event]
                           (let [lngLat (.-lngLat event)
                                 lng (js/parseFloat (aget lngLat "lng"))
                                 lat (js/parseFloat (aget lngLat "lat"))]
                             (when @selected-dataset
                               (swap! map-state assoc
                                      :selected-point {:lat lat :lng lng})
                               (rf/dispatch [::events/fetch-time-series
                                             {:dataset-id @selected-dataset
                                              :lat lat
                                              :lon lng
                                              :start-date "2020-01-01"
                                              :end-date "2020-12-31"}]))))]

    ;; Load datasets if not already loaded
    (r/create-class
     {:component-did-mount
      (fn []
        (when (empty? @datasets)
          (rf/dispatch [::events/fetch-datasets])))

      :reagent-render
      (fn []
        [:div.map-container
         [:div.map-controls
          [:div.dataset-selector
           [:label "Select Dataset: "]
           [:select.dataset-select
            {:value (or @selected-dataset "")
             :on-change #(rf/dispatch [::events/set-selected-dataset (.. % -target -value)])}
            [:option {:value ""} "-- Select a dataset --"]
            (for [dataset @datasets]
              ^{:key (:id dataset)}
              [:option {:value (:id dataset)} (:name dataset)])]]

          (when @selected-dataset
            [:div.dataset-info
             [:p (str "Selected dataset: "
                      (:name (first (filter #(= (:id %) @selected-dataset) @datasets))))]
             [:p "Click on the map to view time series data for that location."]])]

         ;; Mapbox GL Map Container
         [:div.mapbox-container
          {:style {:width "100%"
                   :height "500px"
                   :margin-top "20px"}}
          (if (and mapbox-token (not-empty mapbox-token))
            ;; Map with token
            [:> Map
             {:mapboxAccessToken mapbox-token
              :initialViewState (:viewport @map-state)
              :style {:width "100%" :height "100%"}
              :mapStyle "mapbox://styles/mapbox/light-v11"
              :onClick handle-map-click
              :onError #(js/console.error "Mapbox error:" %)}

             ;; Only render marker if there's a selected point
             (when-let [point (:selected-point @map-state)]
               [:> Marker
                {:latitude (:lat point)
                 :longitude (:lng point)
                 :offsetLeft -12
                 :offsetTop -24}
                [:div.map-marker "📍"]])]

            ;; Error message when token is missing
            [:div.map-token-missing
             {:style {:width "100%"
                      :height "100%"
                      :display "flex"
                      :flex-direction "column"
                      :align-items "center"
                      :justify-content "center"
                      :background-color "#f0f0f0"
                      :border "1px solid #ccc"
                      :border-radius "4px"}}
             [:h3 "Mapbox API Key Required"]
             [:p "Mapbox token not set correctly"]])]

         ;; Time series data display
         (when (and @time-series (not @loading?))
           [:div.time-series-container
            [:h3 "Time Series Data"]
            (if-let [point (:selected-point @map-state)]
              [:p.location-info
               (str "Location: "
                    (.toFixed (:lat point) 4) "°N, "
                    (.toFixed (:lng point) 4) "°W")]
              [:p "No location selected"])

            [:div.time-series-chart
             ;; Here would go a chart component - for brevity, just show values
             [:table.time-series-table
              {:style {:width "100%"
                       :border-collapse "collapse"
                       :margin-top "10px"}}
              [:thead
               [:tr
                [:th {:style {:border "1px solid #ddd" :padding "8px" :text-align "left"}} "Date"]
                [:th {:style {:border "1px solid #ddd" :padding "8px" :text-align "left"}} "Value"]]]
              [:tbody
               (for [point (take 10 @time-series)]
                 ^{:key (:timestamp point)}
                 [:tr
                  [:td {:style {:border "1px solid #ddd" :padding "8px"}} (:timestamp point)]
                  [:td {:style {:border "1px solid #ddd" :padding "8px"}} (:value point)]])]]]])

         ;; Loading indicator
         (when @loading?
           [:div.loading-indicator
            {:style {:display "flex"
                     :flex-direction "column"
                     :align-items "center"
                     :justify-content "center"
                     :margin-top "20px"}}
            [:div.spinner
             {:style {:border "4px solid #f3f3f3"
                      :border-top "4px solid #3498db"
                      :border-radius "50%"
                      :width "30px"
                      :height "30px"
                      :animation "spin 2s linear infinite"}}]
            [:p "Loading data..."]])])})))

;; Main map page component
(defn map-page []
  [:div.map-page
   [:h1 "Climate Data Explorer"]
   [:p "Interactive map for exploring climate data across different regions."]
   [:p "Select a dataset and click on the map to view time series data for that location."]
   [map-component]]) 