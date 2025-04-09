# frozen_string_literal: true

class DocumentSignature < ApplicationRecord
  belongs_to :document
  belongs_to :user

  after_update_commit :sync_contractor_with_quickbooks, if: :saved_change_to_signed_at?

  private

    def sync_contractor_with_quickbooks
      return unless title == "Signer"
      return unless document.consulting_contract?

      contractor_worker = user.company_worker_for(document.company)
      QuickbooksDataSyncJob.perform_async(company_worker.company_id, contractor_worker.class.name, contractor_worker.id)
    end
end
