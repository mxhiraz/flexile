# frozen_string_literal: true

class Internal::OauthController < Internal::BaseController
  include UserDataSerialization, JwtAuthenticatable

  skip_before_action :verify_authenticity_token

  def create
    email = params[:email]
    params[:invitation_token]

    if email.blank?
      render json: { error: "Email is required" }, status: :bad_request
      return
    end

    user = User.find_by(email: email)
    return success_response_with_jwt(user) if user.persisted?

    result = complete_user_signup(user)

    if result[:success]
      success_response_with_jwt(result[:user], :created)
    else
      render json: { error: result[:error_message] }, status: :unprocessable_entity
    end
  end

  private
    def complete_user_signup(user, invitation_token: nil)
      ApplicationRecord.transaction do
        user = User.new(email: email, confirmed_at: Time.current)
        user.tos_agreements.create!(ip_address: request.remote_ip)

        { success: true, user: user }
      end
    rescue ActiveRecord::RecordInvalid => e
      { success: false, error_message: e.record.errors.full_messages.to_sentence }
    end
end
