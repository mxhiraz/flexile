# frozen_string_literal: true

FactoryBot.define do
  factory :document do
    company
    year { Date.current.year }
    attachments { [Rack::Test::UploadedFile.new(Rails.root.join("spec/fixtures/files/sample.pdf"))] }

    # Consulting contract
    name { Contract::CONSULTING_CONTRACT_NAME }
    document_type { Document.document_types[:consulting_contract] }

    transient do
      user { nil }
      company_administrator { nil }
    end

    after :build do |document, evaluator|
      user = evaluator.user || create(:user)
      document.signatures.build(user:, title: "Signer")
      document.signatures.build(user: evaluator.company_administrator.user, title: "Company Representative") if evaluator.company_administrator.present?
    end

    factory :equity_plan_contract_doc do
      name { "Equity Incentive Plan #{Date.current.year}" }
      document_type { Document.document_types[:equity_plan_contract] }
      equity_grant { create(:equity_grant, company_investor: create(:company_investor, company:)) }
    end

    trait :signed do
      after :build do |document|
        document.signatures.each do |signature|
          signature.signed_at = Time.current
        end
      end
    end

    trait :unsigned do
      after :build do |document|
        document.signatures.each do |signature|
          signature.signed_at = nil
        end
      end
    end

    factory :tax_doc do
      document_type { Document.document_types[:tax_document] }
      name { TaxDocument::ALL_SUPPORTED_TAX_FORM_NAMES.sample }
      user_compliance_info { create(:user_compliance_info) }

      trait :submitted do
        after :build do |document|
          document.signatures.each do |signature|
            signature.signed_at = Time.current
          end
        end
      end

      trait :deleted do
        deleted_at { Time.current }
      end

      trait :form_w9 do
        name { TaxDocument::FORM_W_9 }
      end

      trait :form_w8ben do
        name { TaxDocument::FORM_W_8BEN }
      end

      trait :form_w8bene do
        name { TaxDocument::FORM_W_8BEN_E }
      end

      trait :form_1099div do
        name { TaxDocument::FORM_1099_DIV }
      end

      trait :form_1099nec do
        name { TaxDocument::FORM_1099_NEC }
      end

      trait :form_1042s do
        name { TaxDocument::FORM_1042_S }
      end
    end

    factory :share_certificate_doc do
      document_type { Document.document_types[:share_certificate] }
      name { "Share Certificate" }
    end

    factory :exercise_notice do
      document_type { Document.document_types[:exercise_notice] }
      name { "XA-23 Form of Notice of Exercise (US) 2024.pdf" }
      signed
    end
  end
end
