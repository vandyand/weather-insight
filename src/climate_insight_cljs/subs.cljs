(ns climate-insight-cljs.subs
  (:require [re-frame.core :as rf]))

;; Core app state subscriptions
(rf/reg-sub
 :db
 (fn [db]
   db))

;; Navigation
(rf/reg-sub
 :current-route
 (fn [db]
   (:current-route db)))

;; User and Authentication
(rf/reg-sub
 :auth
 (fn [db]
   (:auth db)))

(rf/reg-sub
 :user
 :<- [:auth]
 (fn [auth]
   (:user auth)))

(rf/reg-sub
 :logged-in?
 :<- [:auth]
 (fn [auth]
   (boolean (:token auth))))

;; Forms
(rf/reg-sub
 :forms
 (fn [db]
   (:forms db)))

(rf/reg-sub
 :form
 :<- [:forms]
 (fn [forms [_ form-id]]
   (get forms form-id)))

(rf/reg-sub
 :form-field
 :<- [:forms]
 (fn [forms [_ form-id field-id]]
   (get-in forms [form-id field-id])))

;; Loading states
(rf/reg-sub
 :loading
 (fn [db [_ key]]
   (get-in db [:loading key] false)))

;; Errors
(rf/reg-sub
 :errors
 (fn [db]
   (:errors db)))

(rf/reg-sub
 :error
 :<- [:errors]
 (fn [errors [_ key]]
   (get errors key)))

;; Datasets
(rf/reg-sub
 :datasets
 (fn [db]
   (:datasets db)))

(rf/reg-sub
 :current-dataset
 (fn [db]
   (:current-dataset db)))

;; Map
(rf/reg-sub
 :map-viewport
 (fn [db]
   (get-in db [:map :viewport])))

(rf/reg-sub
 :selected-dataset
 (fn [db]
   (get-in db [:map :selected-dataset])))

;; Time Series
(rf/reg-sub
 :time-series
 (fn [db]
   (:time-series db)))

;; Aggregated subscriptions
(rf/reg-sub
 :selected-dataset-details
 :<- [:datasets]
 :<- [:selected-dataset]
 (fn [[datasets selected-id]]
   (when selected-id
     (first (filter #(= (:id %) selected-id) datasets))))) 