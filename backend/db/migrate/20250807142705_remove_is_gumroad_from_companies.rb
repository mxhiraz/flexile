class RemoveIsGumroadFromCompanies < ActiveRecord::Migration[8.0]
  def change
    remove_column :companies, :is_gumroad, :boolean
  end
end
