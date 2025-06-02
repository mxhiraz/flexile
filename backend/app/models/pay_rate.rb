class PayRate < ApplicationRecord
  belongs_to :company_contractor, class_name: "CompanyWorker"

  enum :type, {
    hourly: 0,
    project_based: 1,
    salary: 2,
  }, validate: true

  validates :amount, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :currency, presence: true
end
