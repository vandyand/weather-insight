(ns climate-insight-cljs.core
  (:require [reagent.dom :as rdom]
            [re-frame.core :as rf]
            [reitit.frontend :as reitit]
            [reitit.frontend.easy :as rfe]
            [reitit.coercion.spec :as rss]
            [climate-insight-cljs.views.home :as home]
            [climate-insight-cljs.views.map :as map]
            [climate-insight-cljs.views.datasets :as datasets]
            [climate-insight-cljs.views.auth :as auth]
            [climate-insight-cljs.views.navbar :as navbar]
            [climate-insight-cljs.events :as events]
            [climate-insight-cljs.subs]
            [climate-insight-cljs.config :as config]))

;; Routes
(defn routes []
  [["/" {:name :home
         :view home/home-page
         :link-text "Home"}]
   ["/map" {:name :map
            :view map/map-page
            :link-text "Map Explorer"}]
   ["/datasets" {:name :datasets
                 :view datasets/datasets-page
                 :link-text "Datasets"}]
   ["/dataset/:id" {:name :dataset-detail
                    :view datasets/dataset-detail-page
                    :parameters {:path {:id string?}}}]
   ["/login" {:name :login
              :view auth/login-page
              :link-text "Login"}]
   ["/register" {:name :register
                 :view auth/register-page
                 :link-text "Register"}]])

;; Application layout with navbar and current route
(defn app []
  (let [current-route @(rf/subscribe [:current-route])]
    [:div.climate-insight
     [navbar/navbar]
     [:div.main-content
      (when-let [view-fn (and current-route (-> current-route :data :view))]
        (if (fn? view-fn)
          [view-fn]
          [:div.route-error
           [:h2 "Route Error"]
           [:p "Invalid view component for route: "
            (or (-> current-route :data :name) "unknown")]]))]]))

;; Initialize router
(defn init-routes! []
  (rf/dispatch-sync [::events/initialize-db])
  (rfe/start!
   (reitit/router (routes) {:data {:coercion rss/coercion}})
   (fn [m] (rf/dispatch [::events/set-current-route m]))
   {:use-fragment true}))

;; Log configuration in development mode
(defn log-dev-config []
  (js/console.log "Environment configuration:"
                  (clj->js {:api-url (config/get-config :api-url)
                            :mapbox-token-exists? (boolean (not-empty (config/get-config :mapbox-token)))})))

;; Application initialization
(defn ^:export init []
  (log-dev-config)
  (init-routes!)
  (rdom/render [app] (.getElementById js/document "app")))

;; Development tools
(defn ^:dev/after-load reload []
  (rf/clear-subscription-cache!)
  (log-dev-config)
  (init-routes!)
  (rdom/render [app] (.getElementById js/document "app"))) 