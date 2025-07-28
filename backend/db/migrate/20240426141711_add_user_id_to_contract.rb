class AddUserIdToContract < ActiveRecord::Migration[7.1]
  def change
    add_reference :contracts, :user

    up_only do
      execute <<~SQL.squish
        UPDATE contracts
        SET user_id = company_contractors.user_id
        FROM company_contractors
        WHERE contracts.company_contractor_id = company_contractors.id
      SQL
    end

    change_column_null :contracts, :user_id, false
  end
end
