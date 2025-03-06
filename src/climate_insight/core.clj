(ns climate-insight.core
  (:require [org.httpkit.server :as server]
            [taoensso.timbre :as log]
            [mount.core :as mount :refer [defstate]]
            [ring.middleware.defaults :refer [wrap-defaults api-defaults]]
            [ring.middleware.json :refer [wrap-json-response wrap-json-body]]
            [climate-insight.routes :as routes]
            [climate-insight.db.core :as db])
  (:gen-class))

(defn app-routes
  "Initialize all routes"
  []
  (routes/app-routes))

(defn app
  "Initialize the app with middlewares"
  []
  (-> (app-routes)
      (wrap-json-body {:keywords? true})
      (wrap-json-response)
      (wrap-defaults api-defaults)))

(defstate http-server
  :start (let [port (or (some-> (System/getenv "PORT") Integer/parseInt) 3000)
               server (server/run-server (app) {:port port :join? false})]
           (log/info "Server started on port" port)
           server)
  :stop (when http-server
          (http-server :timeout 100)
          (log/info "Server stopped")))

(defn -main
  "Application entry point"
  [& args]
  (mount/start)
  (log/info "Application started"))

(comment
  ;; For REPL development
  (mount/start)
  (mount/stop)
  (mount/status)

  ;; Reload system after making changes
  (mount/stop)
  (mount/start)) 