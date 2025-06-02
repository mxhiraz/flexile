class CreatePayRates < ActiveRecord::Migration[7.0]
  def up
    create_table :pay_rates do |t|
      t.references :company_contractor, null: false, foreign_key: { to_table: :company_contractors }
      t.integer :amount, null: false
      t.string :currency, default: "usd", null: false
      t.integer :type, default: 0, null: false
      t.timestamps
    end

    add_index :pay_rates, :company_contractor_id

    CompanyWorker.find_each do |worker|
      PayRate.create!(
        company_contractor_id: worker.id,
        amount: worker.pay_rate_in_subunits,
        currency: worker.pay_rate_currency,
        type: worker.pay_rate_type
      )
    end

    remove_column :company_contractors, :pay_rate_type
    remove_column :company_contractors, :pay_rate_in_subunits
    remove_column :company_contractors, :pay_rate_currency
  end

  def down
    add_column :company_contractors, :pay_rate_type, :integer, default: 0, null: false
    add_column :company_contractors, :pay_rate_in_subunits, :integer, null: false
    add_column :company_contractors, :pay_rate_currency, :string, default: "usd", null: false

    CompanyWorker.includes(:pay_rates).find_each do |worker|
      first_rate = worker.pay_rates.first
      if first_rate
        worker.update!(
          pay_rate_type: first_rate.type,
          pay_rate_in_subunits: first_rate.amount,
          pay_rate_currency: first_rate.currency
        )
      end
    end

    drop_table :pay_rates
  end
end
