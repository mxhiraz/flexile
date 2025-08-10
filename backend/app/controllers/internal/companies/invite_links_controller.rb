# frozen_string_literal: true

class Internal::Companies::InviteLinksController < Internal::BaseController
  def show
    authorize CompanyAdministrator

    render json: { invite_link: company.invite_link }
  end

  def reset
    authorize CompanyAdministrator

    render json: { invite_link: company.reset_invite_link! }
  end
end
