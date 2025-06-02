FactoryBot.define do
  factory :pay_rate do
    association :company_contractor, factory: :company_worker
    amount { 5000 }
    currency { "usd" }
    type { :hourly }
  end
end
