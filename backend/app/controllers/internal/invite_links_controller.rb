# frozen_string_literal: true

class Internal::InviteLinksController < ApplicationController
  def accept
    result = AcceptCompanyInviteLink.new(token: params[:token], user: Current.user).perform

    if !result[:success]
      render json: { error_message: result[:error] }, status: :unprocessable_entity
    end
  end
end
