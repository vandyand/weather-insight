(ns climate-insight-cljs.views.datasets
  (:require [re-frame.core :as rf]
            [reitit.frontend.easy :as rfe]
            [climate-insight-cljs.events :as events]))

(defn dataset-card [{:keys [id name description source unit time-range]}]
  [:div.dataset-card
   [:div.dataset-card-content
    [:h3 name]
    [:p description]
    [:div.dataset-meta
     [:div.dataset-meta-item (str "Source: " source)]
     [:div.dataset-meta-item (str "Unit: " unit)]
     [:div.dataset-meta-item (str "Time range: " time-range)]]
    [:div.dataset-actions
     [:button.dataset-button
      {:on-click #(do
                    (rf/dispatch [::events/set-selected-dataset id])
                    (rfe/push-state :map))}
      "Explore on Map"]
     [:button.dataset-button
      {:on-click #(rf/dispatch [::events/fetch-dataset-detail id])}
      "View Details"]]]])

(defn datasets-page []
  (let [datasets @(rf/subscribe [:datasets])
        loading? @(rf/subscribe [:loading :datasets])]

    ;; Load datasets if not already loaded
    (when (and (empty? datasets) (not loading?))
      (rf/dispatch [::events/fetch-datasets]))

    [:div.datasets-page
     [:h1 "Climate Datasets"]
     [:p "Explore our collection of climate datasets from various trusted sources."]

     (cond
       loading?
       [:div.loading-container
        [:div.spinner]
        [:p "Loading datasets..."]]

       (empty? datasets)
       [:div.no-datasets
        [:p "No datasets available. Please try again later."]]

       :else
       [:div.datasets-grid
        (for [dataset datasets]
          ^{:key (:id dataset)}
          [dataset-card dataset])])]))

(defn dataset-detail-page []
  (let [dataset @(rf/subscribe [:current-dataset])
        loading? @(rf/subscribe [:loading :dataset-detail])
        current-route @(rf/subscribe [:current-route])
        dataset-id (get-in current-route [:path-params :id])]

    ;; Load dataset details if not already loaded
    (when (and (not= (:id dataset) dataset-id) (not loading?))
      (rf/dispatch [::events/fetch-dataset-detail dataset-id]))

    [:div.dataset-detail-page
     [:div.dataset-header
      [:a.back-link {:href (rfe/href :datasets)} "← Back to Datasets"]]

     (cond
       loading?
       [:div.loading-container
        [:div.spinner]
        [:p "Loading dataset details..."]]

       (not dataset)
       [:div.not-found
        [:h2 "Dataset Not Found"]
        [:p "The requested dataset could not be found."]]

       :else
       [:div.dataset-detail
        [:h1 (:name dataset)]
        [:div.dataset-description
         [:p (:description dataset)]]

        [:div.dataset-properties
         [:div.property-item
          [:h3 "Source"]
          [:p (:source dataset)]]
         [:div.property-item
          [:h3 "Unit"]
          [:p (:unit dataset)]]
         [:div.property-item
          [:h3 "Time Range"]
          [:p (:time-range dataset)]]]

        [:div.dataset-actions
         [:button.dataset-button.primary
          {:on-click #(do
                        (rf/dispatch [::events/set-selected-dataset (:id dataset)])
                        (rfe/push-state :map))}
          "Explore on Map"]]])]))

(defn variable-card
  "Component for displaying a dataset variable"
  [{:keys [name long_name units description min_value max_value colormap]}]
  [:div.card.variable-card
   [:div.card-header
    [:h4.card-title (or long_name name)]]
   [:div.card-body
    [:p description]
    [:div.variable-details
     [:div.variable-detail
      [:span.detail-label "Units: "]
      [:span.detail-value units]]
     [:div.variable-detail
      [:span.detail-label "Range: "]
      [:span.detail-value (if (and min_value max_value)
                            (str min_value " to " max_value)
                            "Not specified")]]
     [:div.variable-detail
      [:span.detail-label "Color Scheme: "]
      [:span.detail-value colormap]]]]]) 