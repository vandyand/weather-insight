(ns climate-insight-cljs.config)

;; Environment variables can be injected into the build using shadow-cljs with :closure-defines
;; See: https://shadow-cljs.github.io/docs/UsersGuide.html#_closure_defines

;; Default values for development
(goog-define API_URL "http://localhost:8080/api")
(goog-define MAPBOX_TOKEN "")

;; Configuration map
(def config
  {:api-url API_URL
   :mapbox-token MAPBOX_TOKEN})

;; Function to get config values
(defn get-config
  ([key]
   (get config key))
  ([key default]
   (get config key default)))

;; Handle Mapbox token with improved logging and error handling
(let [token (get-config :mapbox-token)
      existing-token js/window.MAPBOX_TOKEN]

  ;; Check if token is already set in HTML and is not empty
  (if (and existing-token (not-empty existing-token))
    (do
      (js/console.log "Config: Using existing Mapbox token from HTML (length:" (count existing-token) ")")
      ;; Don't overwrite the existing token
      (js/console.log "Mapbox token verified in window object"))

    ;; Otherwise try to set it from config
    (if (not-empty token)
      (do
        (js/console.log "Config: Setting Mapbox token from config. Length:" (count token))
        (set! js/window.MAPBOX_TOKEN token))

      ;; If no token available, log warning but DON'T overwrite existing token to nil
      (js/console.warn "Config: NO MAPBOX TOKEN FOUND in config - maps may not work!"))))

;; Log final values for debugging
(js/console.log "Final Mapbox token status:" (if (and js/window.MAPBOX_TOKEN (not-empty js/window.MAPBOX_TOKEN))
                                               (str "Token exists (length: " (count js/window.MAPBOX_TOKEN) ")")
                                               "No token found"))

;; Log entire config for debugging
(js/console.log "Complete config:" (clj->js (assoc config :mapbox-token-exists? (boolean (and js/window.MAPBOX_TOKEN
                                                                                              (not-empty js/window.MAPBOX_TOKEN))))))