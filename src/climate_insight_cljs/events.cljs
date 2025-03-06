(ns climate-insight-cljs.events
  (:require [re-frame.core :as rf]
            [day8.re-frame.http-fx]
            [ajax.core :as ajax]
            [climate-insight-cljs.db :as db]
            [climate-insight-cljs.config :as config]))

;; Initialize DB
(rf/reg-event-db
 ::initialize-db
 (fn [_ _]
   db/default-db))

;; Navigation
(rf/reg-event-db
 ::set-current-route
 (fn [db [_ route]]
   (assoc db :current-route route)))

;; Form handling
(rf/reg-event-db
 ::update-form-field
 (fn [db [_ form-id field-id value]]
   (assoc-in db [:forms form-id field-id] value)))

;; Authentication
(rf/reg-event-fx
 ::login
 (fn [{:keys [db]} [_ credentials]]
   (let [api-url (str (config/get-config :api-url) "/auth/login")]
     {:db (-> db
              (assoc-in [:loading :auth] true)
              (dissoc :errors :auth))
      :http-xhrio {:method :post
                   :uri api-url
                   :params credentials
                   :format (ajax/json-request-format)
                   :response-format (ajax/json-response-format {:keywords? true})
                   :on-success [::login-success]
                   :on-failure [::request-failure :auth]}})))

(rf/reg-event-fx
 ::login-success
 (fn [{:keys [db]} [_ response]]
   {:db (-> db
            (assoc :auth {:token (:token response)
                          :user (:user response)})
            (assoc-in [:loading :auth] false)
            (update :forms dissoc :login))
    :fx [[:dispatch [::set-current-route {:name :home}]]]}))

(rf/reg-event-fx
 ::register
 (fn [{:keys [db]} [_ user-data]]
   (let [api-url (str (config/get-config :api-url) "/auth/register")]
     {:db (-> db
              (assoc-in [:loading :auth] true)
              (dissoc :errors :auth))
      :http-xhrio {:method :post
                   :uri api-url
                   :params user-data
                   :format (ajax/json-request-format)
                   :response-format (ajax/json-response-format {:keywords? true})
                   :on-success [::register-success]
                   :on-failure [::request-failure :auth]}})))

(rf/reg-event-fx
 ::register-success
 (fn [{:keys [db]} [_ response]]
   {:db (-> db
            (assoc :auth {:token (:token response)
                          :user (:user response)})
            (assoc-in [:loading :auth] false)
            (update :forms dissoc :register))
    :fx [[:dispatch [::set-current-route {:name :home}]]]}))

(rf/reg-event-db
 ::logout
 (fn [db _]
   (dissoc db :auth)))

;; Datasets
(rf/reg-event-fx
 ::fetch-datasets
 (fn [{:keys [db]} _]
   (let [api-url (str (config/get-config :api-url) "/climate-data/datasets")]
     (if (seq (:datasets db))
       {:db db}  ;; Datasets already loaded
       {:db (assoc-in db [:loading :datasets] true)
        :http-xhrio {:method :get
                     :uri api-url
                     :response-format (ajax/json-response-format {:keywords? true})
                     :on-success [::fetch-datasets-success]
                     :on-failure [:climate-insight-cljs.events/request-failure :datasets]}}))))

(rf/reg-event-db
 ::fetch-datasets-success
 (fn [db [_ response]]
   (-> db
       (assoc :datasets (:datasets response))
       (assoc-in [:loading :datasets] false))))

(rf/reg-event-db
 ::set-selected-dataset
 (fn [db [_ dataset-id]]
   (assoc-in db [:map :selected-dataset] dataset-id)))

(rf/reg-event-fx
 ::fetch-dataset-detail
 (fn [{:keys [db]} [_ dataset-id]]
   (let [existing-dataset (first (filter #(= (:id %) dataset-id) (:datasets db)))]
     (if existing-dataset
       ;; For development we'll use the existing dataset data
       {:db (assoc db :current-dataset existing-dataset)
        :dispatch [::fetch-time-series {:dataset-id dataset-id
                                        :lat 37.7749
                                        :lon -122.4194
                                        :start-date "2020-01-01"
                                        :end-date "2020-12-31"}]}
       ;; In production, would fetch from API
       {:db (assoc-in db [:loading :dataset-detail] true)}))))

;; Time Series
(rf/reg-event-fx
 ::fetch-time-series
 (fn [{:keys [db]} [_ params]]
   (let [{:keys [dataset-id lat lon start-date end-date]} params
         ;; For development, generate mock data
         mock-time-series (condp = dataset-id
                            "temperature" (db/generate-mock-time-series 2020 2021 14.0 0.02)
                            "precipitation" (db/generate-mock-time-series 2020 2021 50.0 0.1)
                            "sea-level" (db/generate-mock-time-series 2020 2021 3000.0 0.5)
                            "co2" (db/generate-mock-time-series 2020 2021 410.0 0.1)
                            ;; Default
                            (db/generate-mock-time-series 2020 2021 10.0 0.01))]
     {:db (assoc-in db [:loading :time-series] true)
      :dispatch-later [{:ms 500  ;; Add artificial delay to simulate network request
                        :dispatch [::fetch-time-series-success mock-time-series]}]})))

(rf/reg-event-db
 ::fetch-time-series-success
 (fn [db [_ time-series]]
   (-> db
       (assoc :time-series time-series)
       (assoc-in [:loading :time-series] false))))

;; Error handling
(rf/reg-event-db
 ::request-failure
 (fn [db [_ request-type response]]
   (-> db
       (assoc-in [:errors request-type] (or (:response response)
                                            (:status-text response)
                                            "Unknown error"))
       (assoc-in [:loading request-type] false)))) 