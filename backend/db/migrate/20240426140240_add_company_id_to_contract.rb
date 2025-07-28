class AddCompanyIdToContract < ActiveRecord::Migration[7.1]
  def change
    add_reference :contracts, :company

    up_only do
      execute <<~SQL.squish
        UPDATE contracts
        SET company_id = company_administrators.company_id
        FROM company_administrators
        WHERE contracts.company_administrator_id = company_administrators.id
      SQL
    end

    change_column_null :contracts, :company_id, false
  end
end
