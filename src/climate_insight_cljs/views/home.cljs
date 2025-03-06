(ns climate-insight-cljs.views.home
  (:require [re-frame.core :as rf]
            [reitit.frontend.easy :as rfe]))

(defn feature-card [title description]
  [:div.feature-card
   [:h3 title]
   [:p description]])

(defn home-page []
  (let [logged-in? @(rf/subscribe [:logged-in?])
        user @(rf/subscribe [:user])]
    [:div.home-page
     [:div.home-hero
      [:h1 "ClimateInsight"]
      [:p "An interactive platform for visualizing climate data through maps and time-series graphs"]

      [:div.home-cta
       (if logged-in?
         [:a.home-button {:href (rfe/href :map)} "Explore Climate Data"]
         [:a.home-button {:href (rfe/href :login)} "Get Started"])]]

     [:div.home-features
      [:h2 "Features"]
      [:div.features-grid
       [feature-card "Interactive Maps"
        "Explore climate data spatially with interactive maps powered by Mapbox GL."]
       [feature-card "Time Series Analysis"
        "Analyze trends over time with interactive charts showing historical climate data."]
       [feature-card "Multiple Datasets"
        "Access various climate datasets including temperature, precipitation, and more."]
       [feature-card "Spatial Queries"
        "Perform location-based analysis with the power of PostgreSQL and PostGIS."]]]

     [:div.home-tech
      [:h2 "Technology Stack"]
      [:div.tech-items
       [:div.tech-item
        [:h4 "Frontend"]
        [:p "ClojureScript with Reagent and re-frame"]]
       [:div.tech-item
        [:h4 "Backend"]
        [:p "Clojure with Ring and PostgreSQL/PostGIS"]]
       [:div.tech-item
        [:h4 "Visualization"]
        [:p "Mapbox GL for maps, Recharts for data visualization"]]
       [:div.tech-item
        [:h4 "Architecture"]
        [:p "Functional reactive programming with pure functions and immutable data structures"]]]]

     (when-not logged-in?
       [:div.home-actions
        [:h2 "Ready to explore?"]
        [:p "Create an account to start exploring climate data or log in to continue your research."]
        [:div.action-buttons
         [:a.home-button {:href (rfe/href :register)} "Create Account"]
         [:a.home-button.secondary {:href (rfe/href :login)} "Log In"]]])])) 