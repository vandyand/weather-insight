(ns climate-insight.routes
  (:require [reitit.ring :as ring]
            [reitit.swagger :as swagger]
            [reitit.swagger-ui :as swagger-ui]
            [reitit.coercion.malli :as malli]
            [reitit.ring.coercion :as coercion]
            [reitit.ring.middleware.muuntaja :as muuntaja]
            [reitit.ring.middleware.parameters :as parameters]
            [muuntaja.core :as m]
            [climate-insight.handlers.climate-data :as climate-data]
            [climate-insight.handlers.auth :as auth]))

(defn health-handler
  "Simple health check endpoint"
  [_]
  {:status 200
   :body {:status "ok"}})

(defn app-routes
  "Define the application routes"
  []
  (ring/ring-handler
   (ring/router
    [;; Documentation
     ["/swagger.json"
      {:get {:no-doc true
             :swagger {:info {:title "ClimateInsight API"
                              :description "API for climate data visualization"}}
             :handler (swagger/create-swagger-handler)}}]

     ;; API endpoints
     ["/api"
      ;; Health check
      ["/health" {:get health-handler}]

      ;; Authentication
      ["/auth"
       ["/register" {:post {:summary "Register a new user"
                            :parameters {:body [:map
                                                [:email string?]
                                                [:password string?]
                                                [:name string?]]}
                            :handler auth/register-handler}}]
       ["/login" {:post {:summary "Login and get JWT token"
                         :parameters {:body [:map
                                             [:email string?]
                                             [:password string?]]}
                         :handler auth/login-handler}}]]

      ;; Climate data endpoints
      ["/climate-data"
       ["/datasets" {:get {:summary "Get available datasets"
                           :handler climate-data/get-datasets}}]
       ["/dataset/:id" {:get {:summary "Get dataset details"
                              :parameters {:path [:map [:id string?]]}
                              :handler climate-data/get-dataset}}]
       ["/time-series" {:post {:summary "Get time series data for a location"
                               :parameters {:body [:map
                                                   [:dataset-id string?]
                                                   [:lat number?]
                                                   [:lon number?]
                                                   [:start-date string?]
                                                   [:end-date string?]]}
                               :handler climate-data/get-time-series}}]]]

     ;; Serve the frontend SPA for any other paths
     ["/*" {:get {:no-doc true
                  :handler (ring/create-resource-handler
                            {:root "public"
                             :index-files ["index.html"]})}}]]

    ;; Router options
    {:data {:coercion malli/coercion
            :muuntaja m/instance
            :middleware [swagger/swagger-feature
                         parameters/parameters-middleware
                         muuntaja/format-negotiate-middleware
                         muuntaja/format-response-middleware
                         muuntaja/format-request-middleware
                         coercion/coerce-response-middleware
                         coercion/coerce-request-middleware]}})

   ;; Route handler options
   (ring/routes
    (swagger-ui/create-swagger-ui-handler
     {:path "/swagger"
      :config {:validatorUrl nil}})
    (ring/create-default-handler
     {:not-found (constantly {:status 404, :body {:error "Route not found"}})
      :method-not-allowed (constantly {:status 405, :body {:error "Method not allowed"}})
      :not-acceptable (constantly {:status 406, :body {:error "Not acceptable"}})})))) 