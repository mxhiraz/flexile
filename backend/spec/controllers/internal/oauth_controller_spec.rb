# frozen_string_literal: true

require "spec_helper"

RSpec.describe Internal::OauthController, type: :controller do
  let(:api_token) { GlobalConfig.get("API_SECRET_TOKEN", Rails.application.secret_key_base) }
  let(:provider) { "google" }
  let(:provider_id) { "1234567890" }
  let(:email) { "oauthuser@example.com" }

  describe "POST #create" do
    context "with valid parameters" do
      it "creates a user and oauth account, returns JWT" do
        expect do
          post :create, params: { provider: provider, provider_id: provider_id, email: email, token: api_token }
        end.to change(User, :count).by(1)
         .and change(OauthAccount, :count).by(1)

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response["jwt"]).to be_present
        expect(json_response["user"]["email"]).to eq(email)
      end

      it "returns existing user if oauth account exists" do
        user = User.create!(email: email)
        user.oauth_accounts.create!(provider: provider, provider_id: provider_id)
        expect do
          post :create, params: { provider: provider, provider_id: provider_id, email: email, token: api_token }
        end.not_to change(User, :count)
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response["user"]["email"]).to eq(email)
      end
    end

    context "with missing parameters" do
      it "returns error if provider is missing" do
        post :create, params: { provider_id: provider_id, email: email, token: api_token }
        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq("Missing required fields")
      end

      it "returns error if provider_id is missing" do
        post :create, params: { provider: provider, email: email, token: api_token }
        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq("Missing required fields")
      end

      it "returns error if email is missing" do
        post :create, params: { provider: provider, provider_id: provider_id, token: api_token }
        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq("Missing required fields")
      end
    end

    context "with existing user but new oauth account" do
      let!(:existing_user) { User.create!(email: email) }

      it "creates a new oauth account for the user" do
        expect do
          post :create, params: { provider: provider, provider_id: provider_id, email: email, token: api_token }
        end.to change(OauthAccount, :count).by(1)
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response["user"]["email"]).to eq(email)
      end
    end

    context "JWT token validation" do
      it "generates a valid JWT token" do
        post :create, params: { provider: provider, provider_id: provider_id, email: email, token: api_token }
        json_response = JSON.parse(response.body)
        jwt_token = json_response["jwt"]

        jwt_secret = GlobalConfig.get("JWT_SECRET", Rails.application.secret_key_base)
        decoded_token = JWT.decode(jwt_token, jwt_secret, true, { algorithm: "HS256" })
        payload = decoded_token[0]

        user = User.find_by(email: email)
        expect(payload["user_id"]).to eq(user.id)
        expect(payload["email"]).to eq(user.email)
        expect(payload["exp"]).to be > Time.current.to_i
        expect(payload["exp"]).to be <= 1.month.from_now.to_i
      end
    end

    context "when oauth account already exists for another user" do
      let!(:other_user) { User.create!(email: "other@example.com") }
      let!(:account) { other_user.oauth_accounts.create!(provider: provider, provider_id: provider_id) }

      it "returns the associated user" do
        post :create, params: { provider: provider, provider_id: provider_id, email: email, token: api_token }
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response["user"]["email"]).to eq(other_user.email)
      end
    end

    context "with duplicate oauth account creation attempt" do
      let!(:user) { User.create!(email: email) }
      let!(:account) { user.oauth_accounts.create!(provider: provider, provider_id: provider_id) }

      it "does not create a duplicate oauth account" do
        expect do
          post :create, params: { provider: provider, provider_id: provider_id, email: email, token: api_token }
        end.not_to change(OauthAccount, :count)
      end
    end

    context "with unsupported provider" do
      it "returns error for unknown provider" do
        post :create, params: { provider: "unknown", provider_id: provider_id, email: email, token: api_token }
        expect(response).to have_http_status(:unprocessable_entity).or have_http_status(:bad_request)
        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to match(/Missing required fields|Unknown provider/)
      end
    end
  end
end
