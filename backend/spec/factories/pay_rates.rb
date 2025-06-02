FactoryBot.define do
  factory :pay_rate do
    association :company_contractor, factory: :company_worker
    amount { 5000 }
    currency { "usd" }
    type { :hourly }

    trait :hourly do
      type { :hourly }
    end

    trait :project_based do
      type { :project_based }
    end

    trait :salary do
      type { :salary }
    end
  end
end
