# frozen_string_literal: true

class Internal::OauthController < Internal::BaseController
  include UserDataSerialization, JwtAuthenticatable

  skip_before_action :verify_authenticity_token

  def create
    provider_id = params[:provider_id]
    email = params[:email]
    provider = params[:provider]

    unless email.present? && provider_id.present? && provider.present?
      return render json: { error: "Missing required fields" }, status: :unprocessable_entity
    end

    unless OauthAccount.providers.key?(provider)
      return render json: { error: "Unknown provider" }, status: :unprocessable_entity
    end

    user = find_or_create_user_from_oauth(provider, provider_id, email)

    success_response_with_jwt(user)
  end

  private
    def find_or_create_user_from_oauth(provider, provider_id, email)
      account = OauthAccount.find_by(provider: provider, provider_id: provider_id)
      return account.user if account&.user

      user = User.find_or_create_by!(email: email)
      user.oauth_accounts.create!(provider: provider, provider_id: provider_id)
      user
    end
end
