# frozen_string_literal: true

class Internal::Companies::BaseController < Internal::BaseController
  before_action :authenticate_user_json!
  after_action :verify_authorized

  def contractor_status
    authorize Current.user, :show?

    contractor = Current.user.company_workers.find_by(company: Current.company)

    if contractor.nil?
      render json: {
        is_contractor: false,
        contract_signed_elsewhere: false,
        has_active_contract: false,
      }
    else
      render json: {
        is_contractor: true,
        contract_signed_elsewhere: contractor.contract_signed_elsewhere,
        has_active_contract: contractor.active_contract?,
      }
    end
  end
end
