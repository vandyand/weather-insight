(ns climate-insight.handlers.auth
  (:require [climate-insight.db.core :as db]
            [buddy.hashers :as hashers]
            [buddy.sign.jwt :as jwt]
            [taoensso.timbre :as log]))

(def secret (or (System/getenv "JWT_SECRET") "default-dev-secret-do-not-use-in-production"))

(defn generate-token
  "Generate a JWT token for the user"
  [user]
  (let [claims {:user-id (:id user)
                :email (:email user)
                :exp (+ (quot (System/currentTimeMillis) 1000) (* 60 60 24 7))}]
    (jwt/sign claims secret)))

(defn register-handler
  "Handler for user registration"
  [{{:keys [body]} :parameters}]
  (try
    (let [{:keys [email password name]} body
          password-hash (hashers/derive password)
          existing-user (db/select-one {:select [:*]
                                        :from [:users]
                                        :where [:= :email email]})]

      (if existing-user
        {:status 400
         :body {:error "Email already registered"}}
        (let [user (db/insert! :users
                               {:name name
                                :email email
                                :password_hash password-hash})]
          {:status 201
           :body {:message "User registered successfully"
                  :token (generate-token user)}})))
    (catch Exception e
      (log/error "Error during registration" e)
      {:status 500
       :body {:error "Registration failed"}})))

(defn login-handler
  "Handler for user login"
  [{{:keys [body]} :parameters}]
  (try
    (let [{:keys [email password]} body
          user (db/select-one {:select [:*]
                               :from [:users]
                               :where [:= :email email]})]

      (if (and user (hashers/check password (:password_hash user)))
        {:status 200
         :body {:token (generate-token user)
                :user {:id (:id user)
                       :name (:name user)
                       :email (:email user)}}}
        {:status 401
         :body {:error "Invalid credentials"}}))
    (catch Exception e
      (log/error "Error during login" e)
      {:status 500
       :body {:error "Login failed"}})))

(defn verify-token
  "Verify a JWT token"
  [token]
  (try
    (jwt/unsign token secret)
    (catch Exception _
      nil)))

(defn auth-middleware
  "Middleware to verify JWT authentication"
  [handler]
  (fn [request]
    (if-let [auth-header (get-in request [:headers "authorization"])]
      (let [token (second (re-find #"^Bearer (.+)$" auth-header))
            claims (verify-token token)]
        (if claims
          (handler (assoc request :identity claims))
          {:status 401
           :body {:error "Invalid or expired token"}}))
      {:status 401
       :body {:error "Authorization header missing"}}))) 