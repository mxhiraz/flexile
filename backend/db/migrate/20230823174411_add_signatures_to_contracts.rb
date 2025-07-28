class AddSignaturesToContracts < ActiveRecord::Migration[7.0]
  def up
    add_column :contracts, :contractor_signature, :string
    add_column :contracts, :administrator_signature, :string

    execute <<~SQL.squish
      UPDATE contracts
      SET contractor_signature = COALESCE(users.signature, users.legal_name)
      FROM company_contractors
      JOIN users ON users.id = company_contractors.user_id
      WHERE contracts.company_contractor_id = company_contractors.id
        AND contracts.signed_at IS NOT NULL
    SQL

    execute <<~SQL.squish
      UPDATE contracts
      SET administrator_signature = COALESCE(admin_users.signature, admin_users.legal_name)
      FROM company_administrators
      JOIN users AS admin_users ON admin_users.id = company_administrators.user_id
      WHERE contracts.company_administrator_id = company_administrators.id
    SQL

    change_column_null :contracts, :administrator_signature, false
  end

  def down
    remove_column :contracts, :contractor_signature
    remove_column :contracts, :administrator_signature
  end
end
