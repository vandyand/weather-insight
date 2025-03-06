(ns climate-insight-cljs.views.auth
  (:require [re-frame.core :as rf]
            [reitit.frontend.easy :as rfe]
            [climate-insight-cljs.events :as events]))

(defn form-input [{:keys [id label type value on-change error]}]
  [:div.input-group
   [:label {:for id} label]
   [:input.input-field
    {:id id
     :type (or type "text")
     :value value
     :on-change on-change}]
   (when error
     [:div.input-error error])])

(defn login-page []
  (let [form @(rf/subscribe [:form :login])
        loading? @(rf/subscribe [:loading :auth])
        error @(rf/subscribe [:error :auth])
        email (or (:email form) "")
        password (or (:password form) "")]

    [:div.auth-container
     [:h1 "Log In"]

     (when error
       [:div.auth-error error])

     [:form.auth-form
      {:on-submit (fn [e]
                    (.preventDefault e)
                    (rf/dispatch [::events/login {:email email
                                                  :password password}]))}

      [form-input {:id "email"
                   :label "Email"
                   :type "email"
                   :value email
                   :on-change #(rf/dispatch [::events/update-form-field :login :email (.. % -target -value)])}]

      [form-input {:id "password"
                   :label "Password"
                   :type "password"
                   :value password
                   :on-change #(rf/dispatch [::events/update-form-field :login :password (.. % -target -value)])}]

      [:button.auth-button
       {:type "submit"
        :disabled loading?}
       (if loading? "Logging in..." "Log In")]

      [:div.auth-link
       "Don't have an account? "
       [:a {:href (rfe/href :register)} "Register here"]]]]))

(defn register-page []
  (let [form @(rf/subscribe [:form :register])
        loading? @(rf/subscribe [:loading :auth])
        error @(rf/subscribe [:error :auth])
        name (or (:name form) "")
        email (or (:email form) "")
        password (or (:password form) "")]

    [:div.auth-container
     [:h1 "Create Account"]

     (when error
       [:div.auth-error error])

     [:form.auth-form
      {:on-submit (fn [e]
                    (.preventDefault e)
                    (rf/dispatch [::events/register {:name name
                                                     :email email
                                                     :password password}]))}

      [form-input {:id "name"
                   :label "Full Name"
                   :value name
                   :on-change #(rf/dispatch [::events/update-form-field :register :name (.. % -target -value)])}]

      [form-input {:id "email"
                   :label "Email"
                   :type "email"
                   :value email
                   :on-change #(rf/dispatch [::events/update-form-field :register :email (.. % -target -value)])}]

      [form-input {:id "password"
                   :label "Password"
                   :type "password"
                   :value password
                   :on-change #(rf/dispatch [::events/update-form-field :register :password (.. % -target -value)])}]

      [:button.auth-button
       {:type "submit"
        :disabled loading?}
       (if loading? "Creating account..." "Create Account")]

      [:div.auth-link
       "Already have an account? "
       [:a {:href (rfe/href :login)} "Log in here"]]]]))

(defn profile-page []
  (let [user @(rf/subscribe [:user])]
    (if user
      [:div.profile-container
       [:h1 "Your Profile"]
       [:div.profile-info
        [:div.profile-field
         [:span.field-label "Name: "]
         [:span.field-value (:name user)]]
        [:div.profile-field
         [:span.field-label "Email: "]
         [:span.field-value (:email user)]]]

       [:div.profile-actions
        [:button.profile-button
         {:on-click #(rf/dispatch [::events/logout])}
         "Log Out"]]]

      ;; If not logged in, redirect to login
      (do
        (js/setTimeout #(rfe/push-state :login) 0)
        [:div.loading-container
         [:div.spinner]
         [:p "Redirecting to login..."]])))) 