(ns climate-insight-cljs.views.navbar
  (:require [re-frame.core :as rf]
            [reitit.frontend.easy :as rfe]))

(defn navbar-link [route-name text active?]
  [:a.navbar-link
   {:href (rfe/href route-name)
    :class (when active? "active")}
   text])

(defn navbar []
  (let [current-route @(rf/subscribe [:current-route])
        logged-in? @(rf/subscribe [:logged-in?])
        routes (->> (if logged-in?
                      [[:home "Home"]
                       [:map "Map Explorer"]
                       [:datasets "Datasets"]]
                      [[:home "Home"]])
                    (map (fn [[route text]]
                           [route text (= route (get-in current-route [:data :name]))])))]
    [:nav.navbar
     [:div.navbar-container
      [:a.navbar-brand {:href (rfe/href :home)} "ClimateInsight"]
      [:div.navbar-links
       (for [[route text active?] routes]
         ^{:key (name route)}
         [navbar-link route text active?])

       ;; Auth links
       (if logged-in?
         [:a.navbar-link
          {:href "#"
           :on-click #(do (.preventDefault %)
                          (rf/dispatch [:climate-insight-cljs.events/logout]))}
          "Logout"]

         [:<>
          [navbar-link :login "Login" (= :login (get-in current-route [:data :name]))]
          [navbar-link :register "Register" (= :register (get-in current-route [:data :name]))]])]]])) 